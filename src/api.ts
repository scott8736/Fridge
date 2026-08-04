import { API_BASE_URL } from "./config";
import type { AnalyzeResult } from "./types";

export class ApiError extends Error {}

/**
 * 냉장고 사진(base64, prefix 없이)을 백엔드로 보내 재료 인식 + 레시피 추천을 받아와요.
 */
export async function analyzeFridgeImage(base64: string): Promise<AnalyzeResult> {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!res.ok) {
    throw new ApiError(`냉장고 사진을 분석하지 못했어요. (status: ${res.status})`);
  }

  return (await res.json()) as AnalyzeResult;
}

/**
 * 재료/메뉴 이름으로 쿠팡파트너스 제휴 딥링크를 발급받아요.
 */
export async function getCoupangPartnersLink(keyword: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/coupang-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });

  if (!res.ok) {
    throw new ApiError(`구매 링크를 가져오지 못했어요. (status: ${res.status})`);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
