export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  difficulty: "쉬움" | "보통" | "어려움";
  /** 냉장고 사진에서 이미 확인된 재료 */
  usedIngredients: string[];
  /** 냉장고에는 없어서 구매가 필요한 재료 */
  neededIngredients: string[];
  /** 재료 손질법 팁 */
  prepNotes: string[];
  /** 조리 순서 */
  steps: string[];
}

export interface AnalyzeResult {
  /** 사진에서 인식된 냉장고 속 재료 목록 */
  ingredients: string[];
  recipes: Recipe[];
}
