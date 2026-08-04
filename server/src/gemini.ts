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

const RECIPE_FIELD_GUIDE = `4. prepNotes에는 재료 손질법을, steps에는 조리 순서를 실제 조리가 가능할 만큼 구체적으로 한국어로 작성해주세요.
5. cookTimeMinutes는 예상 조리 시간(분)이에요.
6. category는 요리를 가장 잘 나타내는 분류 하나를 "국물", "밥/면", "볶음", "구이/전", "반찬", "디저트/기타" 중에서 골라주세요.
7. emoji는 그 요리를 대표하는 이모지를 정확히 1개만 골라주세요 (예: 김치찌개 -> 🍲, 계란볶음밥 -> 🍳).`;

async function callGeminiVision(env: GeminiEnv, prompt: string, imageBase64: string, schema: object): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }],
          },
        ],
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

  const text = await callGeminiVision(env, prompt, imageBase64, schema);
  const parsed = JSON.parse(text) as { ingredients: string[]; recipes: Omit<Recipe, "id">[] };

  return {
    ingredients: parsed.ingredients,
    recipes: parsed.recipes.map((recipe, i) => ({ id: `recipe-${i}`, ...recipe })),
  };
}

/**
 * "광고 보고 레시피 더보기" 보상형 광고 시청 후 호출해요.
 * 같은 냉장고 사진을 다시 분석하되, 이미 추천한 레시피(excludeNames)와 겹치지 않는 새 레시피를 받아와요.
 */
export async function fetchMoreRecipes(env: GeminiEnv, imageBase64: string, excludeNames: string[]): Promise<Recipe[]> {
  const prompt = `이 사진은 사용자의 냉장고 내부 사진이에요.
이미 다음 레시피들은 추천했으니 이번엔 겹치지 않는 다른 레시피를 2~3개 더 추천해주세요: ${excludeNames.join(", ")}.
1. usedIngredients에는 사진 속에서 실제로 사용하는 재료만, neededIngredients에는 냉장고에 없어서 추가로 구매해야 하는 재료만 넣어주세요.
${RECIPE_FIELD_GUIDE}`;

  const schema = {
    type: "OBJECT",
    properties: {
      recipes: { type: "ARRAY", items: RECIPE_ITEM_SCHEMA },
    },
    required: ["recipes"],
  };

  const text = await callGeminiVision(env, prompt, imageBase64, schema);
  const parsed = JSON.parse(text) as { recipes: Omit<Recipe, "id">[] };

  return parsed.recipes.map((recipe, i) => ({ id: `more-${Date.now()}-${i}`, ...recipe }));
}
