/**
 * 백엔드(Cloudflare Worker) API 주소.
 * server/ 를 배포한 뒤 실제 워커 주소로 바꿔주세요. (server/README 참고)
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "https://fridge-recipe-api.YOUR_SUBDOMAIN.workers.dev";

/** 쿠팡파트너스 정책상 반드시 노출해야 하는 수수료 고지 문구예요. 문구를 임의로 바꾸지 마세요. */
export const COUPANG_PARTNERS_DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
