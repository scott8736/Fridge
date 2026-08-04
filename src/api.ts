import { API_BASE_URL } from "./config";
import type { AnalyzeResult, AnalysisSource, Recipe } from "./types";

export class ApiError extends Error {}

async function postJson<T>(path: string, body: unknown, errorMessage: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(`${errorMessage} (status: ${res.status})`);
  }

  return (await res.json()) as T;
}

/**
 * 냉장고 사진(base64, prefix 없이)을 백엔드로 보내 재료 인식 + 레시피 추천을 받아와요.
 */
export function analyzeFridgeImage(base64: string): Promise<AnalyzeResult> {
  return postJson("/api/analyze", { imageBase64: base64 }, "냉장고 사진을 분석하지 못했어요.");
}

/**
 * 사진 없이 사용자가 직접 입력한 재료 목록으로 레시피를 추천받아요.
 */
export function analyzeIngredients(ingredients: string[]): Promise<AnalyzeResult> {
  return postJson("/api/analyze-text", { ingredients }, "레시피를 추천받지 못했어요.");
}

/**
 * 재료 입력 없이 "오늘의 메뉴"를 일반 추천받아요.
 */
export function recommendTodayMenu(): Promise<AnalyzeResult> {
  return postJson("/api/recommend-today", {}, "오늘의 메뉴를 추천받지 못했어요.");
}

/**
 * "광고 보고 레시피 더보기" 보상형 광고 시청 후 호출해요.
 * 같은 맥락(사진/직접입력 재료/오늘의 메뉴)으로 이미 추천받은 레시피(excludeNames)와 겹치지 않는 새 레시피를 받아와요.
 */
export function fetchMoreRecipes(source: AnalysisSource, excludeNames: string[]): Promise<Recipe[]> {
  const body =
    source.type === "image"
      ? { imageBase64: source.base64, excludeNames }
      : source.type === "text"
        ? { ingredients: source.ingredients, excludeNames }
        : { excludeNames };

  return postJson<{ recipes: Recipe[] }>("/api/more-recipes", body, "추가 레시피를 가져오지 못했어요.").then(
    (data) => data.recipes,
  );
}

/**
 * 재료/메뉴 이름으로 쿠팡파트너스 제휴 딥링크를 발급받아요.
 */
export function getCoupangPartnersLink(keyword: string): Promise<string> {
  return postJson<{ url: string }>("/api/coupang-link", { keyword }, "구매 링크를 가져오지 못했어요.").then(
    (data) => data.url,
  );
}
