import type { AnalyzeResult } from "./types";

export interface DemoSet {
  /** 홈 화면 예시 미리보기 헤더에 붙는 라벨 */
  label: string;
  result: AnalyzeResult;
}

/**
 * 홈 화면 예시 미리보기 / "샘플로 체험하기" 데모용 하드코딩 데이터예요.
 * 실제 분석 결과가 아니라는 걸 항상 "예시" 배지와 함께 표기해주세요.
 * 방문할 때마다 이 중 하나를 랜덤으로 보여줘서 매번 같은 화면이 뜨지 않게 해요.
 */
export const DEMO_SETS: DemoSet[] = [
  {
    label: "자취생 냉장고",
    result: {
      ingredients: ["계란 4개", "대파", "애호박", "김치", "다진마늘", "식용유"],
      recipes: [
        {
          id: "solo-1",
          name: "김치계란볶음밥",
          description: "냉장고에 항상 있는 김치와 계란으로 10분 만에 완성하는 든든한 한 끼예요.",
          cookTimeMinutes: 10,
          difficulty: "쉬움",
          category: "밥/면",
          emoji: "🍳",
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
          id: "solo-2",
          name: "애호박전",
          description: "애매하게 남은 애호박을 바삭한 전으로, 술안주로도 반찬으로도 좋아요.",
          cookTimeMinutes: 15,
          difficulty: "쉬움",
          category: "구이/전",
          emoji: "🥞",
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
          id: "solo-3",
          name: "대파계란국",
          description: "재료 3개, 5분이면 끝나는 초간단 국이에요.",
          cookTimeMinutes: 5,
          difficulty: "쉬움",
          category: "국물",
          emoji: "🍲",
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
    },
  },
  {
    label: "다이어트 냉장고",
    result: {
      ingredients: ["닭가슴살", "브로콜리", "두부", "방울토마토", "양파", "올리브유"],
      recipes: [
        {
          id: "diet-1",
          name: "닭가슴살 브로콜리 볶음",
          description: "저지방 고단백, 다이어트 식단으로 딱인 한 그릇 볶음이에요.",
          cookTimeMinutes: 15,
          difficulty: "쉬움",
          category: "볶음",
          emoji: "🥦",
          usedIngredients: ["닭가슴살", "브로콜리", "양파", "올리브유"],
          neededIngredients: ["후추", "소금"],
          prepNotes: ["닭가슴살은 한입 크기로 썰어 소금, 후추로 밑간해주세요.", "브로콜리는 끓는 물에 1분만 데쳐주세요."],
          steps: [
            "팬에 올리브유를 두르고 양파를 볶아 향을 내요.",
            "닭가슴살을 넣고 겉면이 익을 때까지 볶아요.",
            "데친 브로콜리를 넣고 2~3분 더 볶아요.",
            "소금, 후추로 간을 맞춰 마무리해요.",
          ],
        },
        {
          id: "diet-2",
          name: "두부 스테이크",
          description: "고기 없이도 든든한, 담백한 두부 스테이크예요.",
          cookTimeMinutes: 12,
          difficulty: "쉬움",
          category: "구이/전",
          emoji: "🧊",
          usedIngredients: ["두부", "올리브유"],
          neededIngredients: ["부침가루", "간장", "굴소스"],
          prepNotes: ["두부는 키친타월로 감싸 물기를 충분히 빼주세요."],
          steps: [
            "두부를 도톰하게 썰어 부침가루를 얇게 묻혀요.",
            "팬에 올리브유를 두르고 앞뒤로 노릇하게 구워요.",
            "간장, 굴소스를 섞은 소스를 곁들여요.",
          ],
        },
        {
          id: "diet-3",
          name: "방울토마토 두부 무침",
          description: "썰어서 섞기만 하면 끝나는 5분 샐러드예요.",
          cookTimeMinutes: 5,
          difficulty: "쉬움",
          category: "반찬",
          emoji: "🍅",
          usedIngredients: ["방울토마토", "두부"],
          neededIngredients: ["발사믹식초", "올리브유"],
          prepNotes: ["방울토마토는 반으로, 두부는 깍둑썰기 해주세요."],
          steps: [
            "두부와 방울토마토를 그릇에 담아요.",
            "올리브유와 발사믹식초를 뿌려요.",
            "가볍게 섞어 완성해요.",
          ],
        },
      ],
    },
  },
  {
    label: "집밥 냉장고",
    result: {
      ingredients: ["돼지고기", "감자", "양파", "애호박", "대파", "고추장"],
      recipes: [
        {
          id: "home-1",
          name: "제육볶음",
          description: "매콤하게 볶아낸 든든한 집밥 메뉴, 밥도둑이 따로 없어요.",
          cookTimeMinutes: 20,
          difficulty: "보통",
          category: "볶음",
          emoji: "🌶️",
          usedIngredients: ["돼지고기", "양파", "대파", "고추장"],
          neededIngredients: ["설탕", "다진마늘", "간장"],
          prepNotes: ["돼지고기는 키친타월로 핏물을 제거해주세요.", "양파와 대파는 채 썰어주세요."],
          steps: [
            "고추장, 간장, 설탕, 다진마늘을 섞어 양념장을 만들어요.",
            "돼지고기에 양념장을 넣고 10분간 재워요.",
            "달군 팬에 재운 고기를 볶아요.",
            "양파를 넣고 함께 볶다가 대파를 올려 마무리해요.",
          ],
        },
        {
          id: "home-2",
          name: "감자조림",
          description: "짭조름하고 촉촉한, 물리지 않는 밑반찬이에요.",
          cookTimeMinutes: 20,
          difficulty: "쉬움",
          category: "반찬",
          emoji: "🥔",
          usedIngredients: ["감자", "양파"],
          neededIngredients: ["간장", "설탕", "식용유"],
          prepNotes: ["감자는 한입 크기로 썰어 물에 담가 전분기를 빼주세요."],
          steps: [
            "팬에 식용유를 두르고 감자를 겉만 살짝 볶아요.",
            "양파와 물, 간장, 설탕을 넣고 끓여요.",
            "국물이 자작해질 때까지 중약불로 졸여요.",
          ],
        },
        {
          id: "home-3",
          name: "애호박된장찌개",
          description: "구수한 된장에 애호박을 더한 기본 집밥 찌개예요.",
          cookTimeMinutes: 20,
          difficulty: "쉬움",
          category: "국물",
          emoji: "🍲",
          usedIngredients: ["애호박", "양파", "대파"],
          neededIngredients: ["된장", "두부", "다시마육수"],
          prepNotes: ["애호박은 반달모양으로 썰어주세요."],
          steps: [
            "육수에 된장을 풀어 끓여요.",
            "애호박과 양파를 넣고 끓여요.",
            "두부와 대파를 넣고 한소끔 더 끓여 마무리해요.",
          ],
        },
      ],
    },
  },
];

export function pickRandomDemoSet(): DemoSet {
  return DEMO_SETS[Math.floor(Math.random() * DEMO_SETS.length)];
}
