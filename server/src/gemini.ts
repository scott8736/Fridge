/**
 * 무료 키만 써요. 유료 키는 일부러 두지 않아요(2026-10-07 결정).
 * 실측상 유료로 사진 1건 약 14원인데 광고 수익은 건당 2~3원이라, 유료로 넘어가면 그대로 적자예요.
 * 무료 키가 전부 막히면 실패를 돌려주고, 앱이 예시 레시피를 "예시"라고 밝혀 보여줘요.
 */
export interface GeminiEnv {
  /** 무료 키들, 쉼표로 구분 */
  GEMINI_FREE_KEYS?: string;
}

export type RecipeCategory = "국물" | "밥/면" | "볶음" | "구이/전" | "반찬" | "디저트/기타";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  difficulty: "쉬움" | "보통" | "어려움";
  category: RecipeCategory;
  emoji: string;
  usedIngredients: string[];
  neededIngredients: string[];
  prepNotes: string[];
  steps: string[];
}

export interface AnalyzeResult {
  ingredients: string[];
  recipes: Recipe[];
}

/** 레시피 재생성(더보기)에 쓰는 맥락. 빈 객체면 특정 재료 제약 없는 "오늘의 메뉴" 추천이에요. */
export type RecipeSource = { imageBase64: string } | { ingredients: string[] } | Record<string, never>;

/**
 * 2026-10-07 무료 키로 실측한 순서예요. listModels 목록은 믿지 말고 실제 호출로 고를 것.
 * - 사진: flash-lite 는 4.5초로 빠르지만 냉장고 밖 캔·스티커를 재료로 지어내서 쓰지 않아요.
 * - 글자(직접 입력·오늘의 메뉴): 재료를 읽을 일이 없으니 빠른 lite 를 먼저 써요.
 * 예전 기본값 gemini-2.5-flash 는 무료 키 대부분에서 막혀 있어요(2026-09-11).
 *
 * 생각(thinking) 토큰은 꺼요(thinkingBudget 0). 사진 분석이 13~15초 -> 5~8초로 줄고 재료 인식은 그대로였어요.
 * - thinkingLevel "minimal" 은 쓰지 마세요: 닫힌 냉장고 사진에 레시피 0개를 돌려준 적이 있어요.
 * - lite 모델은 원래 생각 토큰이 없고, thinkingBudget 을 넣으면 400 이 나요 -> 넣지 않아요.
 */
const IMAGE_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
const TEXT_MODELS = ["gemini-flash-lite-latest", "gemini-3.6-flash", "gemini-flash-latest"];

/** 모델 하나당 시도할 무료 키 개수. 모델 3개 x 2 = 최대 6번. */
const FREE_KEYS_PER_MODEL = 2;
const ATTEMPT_TIMEOUT_MS = 40_000;

export class GeminiUnavailableError extends Error {}

interface GeminiRequest {
  contents: unknown[];
  generationConfig: Record<string, unknown>;
}

function bodyFor(model: string, request: GeminiRequest): GeminiRequest {
  if (model.includes("lite")) return request;
  return {
    ...request,
    generationConfig: { ...request.generationConfig, thinkingConfig: { thinkingBudget: 0 } },
  };
}

/** 레시피가 하나도 없는 응답은 실패로 보고 다음 키·모델로 다시 시도해요. */
function hasRecipes(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as { recipes?: unknown[] };
    return Array.isArray(parsed.recipes) && parsed.recipes.length > 0;
  } catch {
    return false;
  }
}

function freeKeys(env: GeminiEnv): string[] {
  return (env.GEMINI_FREE_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

/** 매 요청마다 시작 키를 무작위로 골라 한 키에 몰리지 않게 해요. */
function rotated<T>(items: T[]): T[] {
  if (items.length === 0) return items;
  const start = Math.floor(Math.random() * items.length);
  return [...items.slice(start), ...items.slice(0, start)];
}

type AttemptResult =
  | { ok: true; text: string }
  | { ok: false; reason: "key" | "model" | "transient"; status: number };

async function attempt(key: string, model: string, body: unknown): Promise<AttemptResult> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "transient", status: 0 };
  }

  if (!res.ok) {
    const detail = await res.text();
    // 키 값이 아니라 상태만 남겨요.
    console.warn(`gemini ${model} -> ${res.status} ${detail.slice(0, 120).replace(/\s+/g, " ")}`);
    if (res.status === 404) return { ok: false, reason: "model", status: res.status };
    if (res.status === 400 && !detail.includes("API_KEY_INVALID")) {
      return { ok: false, reason: "model", status: res.status };
    }
    if ([400, 401, 403, 429].includes(res.status)) return { ok: false, reason: "key", status: res.status };
    return { ok: false, reason: "transient", status: res.status };
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ok: false, reason: "transient", status: 200 };
  return { ok: true, text };
}

/**
 * 무료 키를 돌려 쓰고(모델도 차례로 바꿔가며), 전부 막히면 실패를 돌려줘요.
 * 키·모델 상태는 로그로만 남기고, 클라이언트에는 원문 오류를 넘기지 않아요.
 */
async function generateWithFallback(env: GeminiEnv, models: string[], request: GeminiRequest): Promise<string> {
  const deadKeys = new Set<string>();
  const keys = rotated(freeKeys(env));
  let cursor = 0;

  for (const model of models) {
    let tried = 0;
    while (tried < FREE_KEYS_PER_MODEL && deadKeys.size < keys.length) {
      const key = keys[cursor++ % keys.length];
      if (deadKeys.has(key)) continue;
      tried++;
      const result = await attempt(key, model, bodyFor(model, request));
      if (result.ok) {
        if (hasRecipes(result.text)) return result.text;
        console.warn(`gemini ${model} -> 레시피 없는 응답, 다시 시도`);
        continue;
      }
      if (result.reason === "key") deadKeys.add(key);
      if (result.reason === "model") break;
    }
  }

  throw new GeminiUnavailableError("모든 Gemini 키·모델이 응답하지 않았어요.");
}

/**
 * 점검용: 무료 키마다 사진용 첫 모델로 아주 짧게 호출해 몇 개가 살아 있는지 세요.
 */
export async function checkGeminiKeys(env: GeminiEnv) {
  const model = IMAGE_MODELS[0];
  // 실제 요청과 같이 생각 토큰을 꺼요. 켜 두면 짧은 출력 한도를 생각에 다 써서 빈 응답이 와요.
  const body = bodyFor(model, {
    contents: [{ parts: [{ text: "OK 한 단어만 답해주세요." }] }],
    generationConfig: { maxOutputTokens: 20 },
  });
  const results = await Promise.all(freeKeys(env).map((key) => attempt(key, model, body)));
  const freeOk = results.filter((r) => r.ok).length;
  return {
    ok: freeOk > 0,
    model,
    freeOk,
    freeTotal: results.length,
    freeStatuses: results.map((r) => (r.ok ? "ok" : r.status === 200 ? "empty" : r.status)),
  };
}

const RECIPE_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    description: { type: "STRING" },
    cookTimeMinutes: { type: "INTEGER" },
    difficulty: { type: "STRING", enum: ["쉬움", "보통", "어려움"] },
    category: { type: "STRING", enum: ["국물", "밥/면", "볶음", "구이/전", "반찬", "디저트/기타"] },
    emoji: { type: "STRING" },
    usedIngredients: { type: "ARRAY", items: { type: "STRING" } },
    neededIngredients: { type: "ARRAY", items: { type: "STRING" } },
    prepNotes: { type: "ARRAY", items: { type: "STRING" } },
    steps: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "name",
    "description",
    "cookTimeMinutes",
    "difficulty",
    "category",
    "emoji",
    "usedIngredients",
    "neededIngredients",
    "prepNotes",
    "steps",
  ],
};

const RECIPE_FIELD_GUIDE = `prepNotes에는 재료 손질법을, steps에는 조리 순서를 실제 조리가 가능할 만큼 구체적으로 한국어로 작성해주세요.
cookTimeMinutes는 예상 조리 시간(분)이에요.
category는 요리를 가장 잘 나타내는 분류 하나를 "국물", "밥/면", "볶음", "구이/전", "반찬", "디저트/기타" 중에서 골라주세요.
emoji는 그 요리를 대표하는 이모지를 정확히 1개만 골라주세요 (예: 김치찌개 -> 🍲, 계란볶음밥 -> 🍳).
레시피 이름과 설명에 실존 인물·요리사·식당·상표 이름을 넣지 마세요 (예: "백종원표" 같은 표현 금지).`;

const RECIPES_ONLY_SCHEMA = {
  type: "OBJECT",
  properties: {
    recipes: { type: "ARRAY", items: RECIPE_ITEM_SCHEMA },
  },
  required: ["recipes"],
};

async function callGemini(
  env: GeminiEnv,
  prompt: string,
  schema: object,
  imageBase64?: string,
  temperature?: number,
): Promise<string> {
  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (imageBase64) parts.push({ inline_data: { mime_type: "image/jpeg", data: imageBase64 } });

  const request: GeminiRequest = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      ...(temperature !== undefined ? { temperature } : {}),
    },
  };

  return generateWithFallback(env, imageBase64 ? IMAGE_MODELS : TEXT_MODELS, request);
}

function toRecipes(text: string): Recipe[] {
  const parsed = JSON.parse(text) as { recipes: Omit<Recipe, "id">[] };
  return parsed.recipes.map((recipe, i) => ({ id: `recipe-${Date.now()}-${i}`, ...recipe }));
}

export async function analyzeFridgeImage(env: GeminiEnv, imageBase64: string): Promise<AnalyzeResult> {
  const prompt = `이 사진은 사용자의 냉장고 내부 사진이에요.
1. 사진에서 실제로 식별 가능한 식재료만 골라 ingredients 목록으로 정리해주세요. 확실하지 않은 재료는 넣지 마세요.
2. 그 재료들로 만들 수 있는 한국 가정식 레시피를 3~4개 추천해주세요.
3. 각 레시피의 usedIngredients에는 사진 속에서 실제로 사용하는 재료만, neededIngredients에는 냉장고에 없어서 추가로 구매해야 하는 재료만 넣어주세요.
${RECIPE_FIELD_GUIDE}`;

  const schema = {
    type: "OBJECT",
    properties: {
      ingredients: { type: "ARRAY", items: { type: "STRING" } },
      recipes: { type: "ARRAY", items: RECIPE_ITEM_SCHEMA },
    },
    required: ["ingredients", "recipes"],
  };

  const text = await callGemini(env, prompt, schema, imageBase64);
  const parsed = JSON.parse(text) as { ingredients: string[]; recipes: Omit<Recipe, "id">[] };
  return {
    ingredients: parsed.ingredients,
    recipes: parsed.recipes.map((recipe, i) => ({ id: `recipe-${i}`, ...recipe })),
  };
}

/**
 * 사진 없이 사용자가 직접 입력한 재료 목록만으로 레시피를 추천해요.
 * ingredients는 모델이 만들어내지 않고 사용자가 준 값을 그대로 돌려줘요(모델이 재료를 임의로 바꿔치기하는 걸 방지).
 */
export async function analyzeIngredientList(env: GeminiEnv, ingredients: string[]): Promise<AnalyzeResult> {
  const prompt = `사용자가 냉장고에 있다고 직접 알려준 재료는 다음과 같아요: ${ingredients.join(", ")}.
이 재료들로 만들 수 있는 한국 가정식 레시피를 3~4개 추천해주세요.
각 레시피의 usedIngredients에는 알려준 재료 중 실제로 사용하는 것만, neededIngredients에는 알려준 재료에 없어서 추가로 구매해야 하는 재료만 넣어주세요.
${RECIPE_FIELD_GUIDE}`;

  const text = await callGemini(env, prompt, RECIPES_ONLY_SCHEMA);
  return { ingredients, recipes: toRecipes(text) };
}

/** "오늘 뭐 먹지" 추천마다 다른 결과가 나오도록 무작위로 섞어 넣는 테마예요. */
const TODAY_MENU_THEMES = [
  "든든하게 배 채우는",
  "가볍고 산뜻한",
  "매콤하고 자극적인",
  "국물이 있는",
  "혼밥하기 좋은 간단한",
  "손님 대접하기 좋은",
  "다이어트에 부담 없는",
  "든든한 보양식 느낌의",
  "밑반찬 없이 한 그릇으로 끝내는",
  "야식으로도 좋은",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * 재료 입력 없이, 오늘 먹을 만한 한국 가정식 메뉴를 일반 추천해줘요("오늘 뭐 먹지" 버튼용).
 * 매번 같은 답이 나오지 않도록 테마를 무작위로 골라 넣고 temperature도 높여요.
 */
export async function recommendTodayMenu(env: GeminiEnv): Promise<AnalyzeResult> {
  const today = new Date();
  const theme = pickRandom(TODAY_MENU_THEMES);
  const prompt = `특정 재료 제약 없이, 오늘(${today.getMonth() + 1}월) 먹기 좋은 "${theme}" 한국 가정식 메뉴를 계절감 있게 3~4개 추천해주세요.
너무 특이하거나 구하기 힘든 재료보다는 흔히 구할 수 있는 재료 위주로 골라주세요.
같은 종류의 메뉴가 반복되지 않도록 다양하게 골라주세요.
${RECIPE_FIELD_GUIDE}`;

  const text = await callGemini(env, prompt, RECIPES_ONLY_SCHEMA, undefined, 1.2);
  return { ingredients: [], recipes: toRecipes(text) };
}

/**
 * "광고 보고 레시피 더보기" 보상형 광고 시청 후 호출해요.
 * 같은 맥락(사진 / 직접 입력한 재료 / 오늘의 메뉴 일반추천)을 유지하되, 이미 추천한 레시피(excludeNames)와 겹치지 않는 새 레시피를 받아와요.
 */
export async function fetchMoreRecipes(env: GeminiEnv, excludeNames: string[], source: RecipeSource): Promise<Recipe[]> {
  let context: string;
  let imageBase64: string | undefined;

  if ("imageBase64" in source) {
    context = "이 사진은 사용자의 냉장고 내부 사진이에요.";
    imageBase64 = source.imageBase64;
  } else if ("ingredients" in source) {
    context = `사용자가 냉장고에 있다고 직접 알려준 재료는 다음과 같아요: ${source.ingredients.join(", ")}.`;
  } else {
    context = `특정 재료 제약 없이 오늘 먹기 좋은 "${pickRandom(TODAY_MENU_THEMES)}" 한국 가정식 메뉴를 추천하는 상황이에요.`;
  }

  const prompt = `${context}
이미 다음 레시피들은 추천했으니 이번엔 겹치지 않는 다른 레시피를 2~3개 더 추천해주세요: ${excludeNames.join(", ")}.
usedIngredients에는 실제로 사용하는 재료만, neededIngredients에는 없어서 추가로 구매해야 하는 재료만 넣어주세요.
${RECIPE_FIELD_GUIDE}`;

  const text = await callGemini(env, prompt, RECIPES_ONLY_SCHEMA, imageBase64, "imageBase64" in source ? undefined : 1.2);
  return toRecipes(text);
}
