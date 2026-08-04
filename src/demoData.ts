import type { AnalyzeResult } from "./types";

/**
 * 홈 화면 예시 미리보기 / "샘플로 체험하기" 데모용 하드코딩 데이터예요.
 * 실제 분석 결과가 아니라는 걸 항상 "예시" 배지와 함께 표기해주세요.
 */
export const DEMO_RESULT: AnalyzeResult = {
  ingredients: ["계란 4개", "대파", "애호박", "김치", "다진마늘", "식용유"],
  recipes: [
    {
      id: "demo-1",
      name: "김치계란볶음밥",
      description: "냉장고에 항상 있는 김치와 계란으로 10분 만에 완성하는 든든한 한 끼예요.",
      cookTimeMinutes: 10,
      difficulty: "쉬움",
      usedIngredients: ["계란", "김치", "대파", "다진마늘", "식용유"],
      neededIngredients: ["햇반"],
      prepNotes: ["김치는 속을 털어내고 잘게 썰어주세요.", "대파는 흰 부분과 푸른 부분을 나눠 썰어두세요."],
      steps: [
        "달군 팬에 식용유를 두르고 다진마늘, 대파 흰 부분을 볶아 향을 내요.",
        "김치를 넣고 2분간 볶아 신맛을 날려요.",
        "밥을 넣고 골고루 섞이도록 볶아요.",
        "팬 한쪽을 비워 계란을 스크램블하듯 익힌 뒤 밥과 섞어요.",
        "대파 푸른 부분을 올려 마무리해요.",
      ],
    },
    {
      id: "demo-2",
      name: "애호박전",
      description: "애매하게 남은 애호박을 바삭한 전으로, 술안주로도 반찬으로도 좋아요.",
      cookTimeMinutes: 15,
      difficulty: "쉬움",
      usedIngredients: ["애호박", "계란", "식용유"],
      neededIngredients: ["부침가루", "소금"],
      prepNotes: ["애호박은 0.5cm 두께로 동글게 썰어 소금을 살짝 뿌려 10분간 절여주세요."],
      steps: [
        "절인 애호박의 물기를 키친타월로 닦아요.",
        "부침가루를 앞뒤로 얇게 묻혀요.",
        "풀어둔 계란물을 입혀요.",
        "달군 팬에 기름을 두르고 앞뒤로 노릇하게 부쳐요.",
      ],
    },
    {
      id: "demo-3",
      name: "대파계란국",
      description: "재료 3개, 5분이면 끝나는 초간단 국이에요.",
      cookTimeMinutes: 5,
      difficulty: "쉬움",
      usedIngredients: ["대파", "계란"],
      neededIngredients: ["국간장", "다시마육수"],
      prepNotes: ["대파는 어슷하게 썰어주세요."],
      steps: [
        "육수를 끓이다가 국간장으로 간을 맞춰요.",
        "끓어오르면 대파를 넣어요.",
        "풀어둔 계란물을 얇게 둘러가며 넣고 젓가락으로 살짝 저어요.",
      ],
    },
  ],
};
