import { Analytics } from "@apps-in-toss/web-framework";

/**
 * 콘솔 이벤트 로그로 퍼널을 보기 위한 얇은 래퍼예요.
 * 촬영/입력 -> 분석 성공·실패 -> 레시피 상세 -> 즐겨찾기·쿠팡·공유 순서로 셀 수 있게 log_name 을 고정해요.
 * 로깅 실패가 앱 흐름을 막으면 안 되니 절대 예외를 던지지 않아요.
 */
type Params = Record<string, string | number | boolean>;

function safe(run: () => Promise<void> | undefined): void {
  try {
    run()?.catch(() => {});
  } catch {
    // 브릿지가 없는 환경(일반 브라우저 등)
  }
}

export function logScreen(name: string, params: Params = {}): void {
  safe(() => Analytics.screen({ log_name: name, ...params }));
}

export function logClick(name: string, params: Params = {}): void {
  safe(() => Analytics.click({ log_name: name, ...params }));
}

export function logImpression(name: string, params: Params = {}): void {
  safe(() => Analytics.impression({ log_name: name, ...params }));
}
