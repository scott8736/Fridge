import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";
import { ensureTossAdsInitialized } from "../ads";
import { AD_GROUP_IDS } from "../adConfig";

interface BannerAdProps {
  /** 체류시간이 긴 화면(결과/상세)은 expanded로, 스쳐가는 화면(홈)은 card를 권장해요. */
  variant?: "card" | "expanded";
}

/** 화면 하단에 붙는 배너 광고. adGroupId가 비어있으면 아무것도 렌더링하지 않아요. */
export function BannerAd({ variant = "card" }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AD_GROUP_IDS.banner || !containerRef.current) return;

    ensureTossAdsInitialized();
    const result = TossAds.attachBanner(AD_GROUP_IDS.banner, containerRef.current, {
      theme: "light",
      variant,
    });

    return () => result.destroy();
  }, [variant]);

  if (!AD_GROUP_IDS.banner) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "8px 0",
      }}
    />
  );
}
