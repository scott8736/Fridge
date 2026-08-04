import { TossAds } from "@apps-in-toss/web-framework";

let initialized = false;

/** TossAds SDK는 앱 전체에서 한 번만 initialize 해야 해요. */
export function ensureTossAdsInitialized() {
  if (initialized) return;
  initialized = true;
  TossAds.initialize({});
}
