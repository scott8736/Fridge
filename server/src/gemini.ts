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

const PROMPT = `이 사진은 사용자의 냉장고 내부 사진이에요.
1. 사진에서 실제로 식별 가능한 식재료만 골라 ingredients 목록으로 정리해주세요. 확실하지 않은 재료는 넣지 마세요.
2. 그 재료들로 만들 수 있는 한국 가정식 레시피를 3~4개 추천해주세요.
3. 각 레시피의 usedIngredients에는 사진 속에서 실제로 사용하는 재료만, neededIngredients에는 냉장고에 없어서 추가로 구매해야 하는 재료만 넣어주세요.
4. prepNotes에는 재료 손질법을, steps에는 조리 순서를 실제 조리가 가능할 만큼 구체적으로 한국어로 작성해주세요.
5. cookTimeMinutes는 예상 조리 시간(분)이에요.
6. category는 요리를 가장 잘 나타내는 분류 하나를 "국물", "밥/면", "볶음", "구이/전", "반찬", "디저트/기타" 중에서 골라주세요.
7. emoji는 그 요리를 대표하는 이모지를 정확히 1개만 골라주세요 (예: 김치찌개 -> 🍲, 계란볶음밥 -> 🍳).`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    ingredients: { type: "ARRAY", items: { type: "STRING" } },
    recipes: {
      type: "ARRAY",
      items: {
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
      },
    },
  },
  required: ["ingredients", "recipes"],
};

export async function analyzeFridgeImage(env: GeminiEnv, imageBase64: string): Promise<AnalyzeResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT }, { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
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

  const parsed = JSON.parse(text) as { ingredients: string[]; recipes: Omit<Recipe, "id">[] };

  return {
    ingredients: parsed.ingredients,
    recipes: parsed.recipes.map((recipe, i) => ({ id: `recipe-${i}`, ...recipe })),
  };
}
