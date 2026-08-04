import { getTossShareLink, share } from "@apps-in-toss/web-framework";
import { CHALLENGE_NAME, TOSS_APP_SCHEME } from "./config";

/**
 * 추천 레시피를 "냉장고 파먹기 챌린지"로 친구에게 공유해요.
 * 실제 분석 결과일 때와 예시(데모) 화면일 때 문구를 다르게 써서, 없는 사실을 말하지 않게 해요.
 */
export async function shareChallenge(recipeName: string, isDemo: boolean): Promise<void> {
  const link = await getTossShareLink(TOSS_APP_SCHEME);

  const message = isDemo
    ? `🧊 ${CHALLENGE_NAME}\n냉장고 사진 한 장이면 AI가 레시피를 추천해줘! "${recipeName}" 같은 메뉴가 뚝딱 나와.\n너네 집 냉장고엔 뭐가 숨어있어? 지금 확인해봐 👉 ${link}`
    : `🧊 ${CHALLENGE_NAME}\n내 냉장고 AI 분석 결과, 오늘의 메뉴는 "${recipeName}"!\n너네 집 냉장고엔 뭐가 숨어있어? 사진 한 장 찍고 확인해봐 👉 ${link}`;

  await share({ message });
}
