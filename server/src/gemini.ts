export interface GeminiEnv {
  GEMINI_API_KEY: string;
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

const MODEL = "gemini-2.5-flash";

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
emoji는 그 요리를 대표하는 이모지를 정확히 1개만 골라주세요 (예: 김치찌개 -> 🍲, 계란볶음밥 -> 🍳).`;

const RECIPES_ONLY_SCHEMA = {
  type: "OBJECT",
  properties: {
    recipes: { type: "ARRAY", items: RECIPE_ITEM_SCHEMA },
  },
  required: ["recipes"],
};

async function callGemini(env: GeminiEnv, prompt: string, schema: object, imageBase64?: string): Promise<string> {
  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (imageBase64) parts.push({ inline_data: { mime_type: "image/jpeg", data: imageBase64 } });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답에 결과가 없어요.");
  return text;
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

/**
 * 재료 입력 없이, 오늘 먹을 만한 한국 가정식 메뉴를 일반 추천해줘요("오늘 뭐 먹지" 버튼용).
 */
export async function recommendTodayMenu(env: GeminiEnv): Promise<AnalyzeResult> {
  const today = new Date();
  const prompt = `특정 재료 제약 없이, 오늘(${today.getMonth() + 1}월) 먹기 좋은 한국 가정식 메뉴를 계절감 있게 3~4개 추천해주세요.
너무 특이하거나 구하기 힘든 재료보다는 흔히 구할 수 있는 재료 위주로 골라주세요.
${RECIPE_FIELD_GUIDE}`;

  const text = await callGemini(env, prompt, RECIPES_ONLY_SCHEMA);
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
    context = "특정 재료 제약 없이 오늘 먹기 좋은 한국 가정식 메뉴를 추천하는 상황이에요.";
  }

  const prompt = `${context}
이미 다음 레시피들은 추천했으니 이번엔 겹치지 않는 다른 레시피를 2~3개 더 추천해주세요: ${excludeNames.join(", ")}.
usedIngredients에는 실제로 사용하는 재료만, neededIngredients에는 없어서 추가로 구매해야 하는 재료만 넣어주세요.
${RECIPE_FIELD_GUIDE}`;

  const text = await callGemini(env, prompt, RECIPES_ONLY_SCHEMA, imageBase64);
  return toRecipes(text);
}
