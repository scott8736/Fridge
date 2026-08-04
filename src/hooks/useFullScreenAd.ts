import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";

interface PlayFullScreenAdResult {
  /** 사용자가 끝까지 시청해서 보상을 받았는지 여부 (보상형 광고 그룹에서만 true가 될 수 있어요) */
  earnedReward: boolean;
  /** 광고가 정상적으로 노출됐는지 여부 (미노출/실패 시 false) */
  shown: boolean;
}

/**
 * 전면형/보상형 통합 광고(adGroupId)를 로드 → 노출까지 한 번에 처리하는 헬퍼예요.
 * adGroupId가 비어있으면(아직 콘솔에서 발급 전) 즉시 스킵돼요.
 */
export function playFullScreenAd(adGroupId: string): Promise<PlayFullScreenAdResult> {
  if (!adGroupId) {
    return Promise.resolve({ earnedReward: false, shown: false });
  }

  return new Promise((resolve) => {
    let earnedReward = false;
    let settled = false;

    const finish = (result: PlayFullScreenAdResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const stopLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === "loaded") {
          const stopShow = showFullScreenAd({
            options: { adGroupId },
            onEvent: (showEvent) => {
              switch (showEvent.type) {
                case "userEarnedReward":
                  earnedReward = true;
                  break;
                case "dismissed":
                  finish({ earnedReward, shown: true });
                  stopShow();
                  break;
                case "failedToShow":
                  finish({ earnedReward: false, shown: false });
                  stopShow();
                  break;
              }
            },
            onError: () => {
              finish({ earnedReward: false, shown: false });
            },
          });
        }
      },
      onError: () => {
        finish({ earnedReward: false, shown: false });
      },
    });

    // 광고 로드가 너무 오래 걸리면(응답 없음) 무한 대기하지 않도록 안전장치를 둬요.
    setTimeout(() => {
      finish({ earnedReward, shown: false });
      stopLoad();
    }, 8000);
  });
}
