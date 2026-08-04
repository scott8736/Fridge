import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";

interface PlayFullScreenAdResult {
  /** 사용자가 끝까지 시청해서 보상을 받았는지 여부 (보상형 광고 그룹에서만 true가 될 수 있어요) */
  earnedReward: boolean;
  /** 광고가 정상적으로 노출됐는지 여부 (미노출/실패 시 false) */
  shown: boolean;
}

const preloadCache = new Map<string, Promise<boolean>>();

function loadAndWait(adGroupId: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const stop = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === "loaded" && !settled) {
          settled = true;
          resolve(true);
        }
      },
      onError: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      },
    });

    // 로드가 너무 오래 걸리면(응답 없음) 무한 대기하지 않도록 안전장치를 둬요.
    setTimeout(() => {
      if (!settled) {
        settled = true;
        stop();
        resolve(false);
      }
    }, 8000);
  });
}

function showAndWait(adGroupId: string): Promise<PlayFullScreenAdResult> {
  return new Promise((resolve) => {
    let earnedReward = false;
    let settled = false;

    const finish = (result: PlayFullScreenAdResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const stopShow = showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        switch (event.type) {
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

    setTimeout(() => finish({ earnedReward, shown: false }), 8000);
  });
}

/**
 * 전면/보상형 통합 광고를 미리 로드만 해둬요. AI 분석처럼 다른 대기시간과 겹쳐서 호출하면,
 * 실제로 보여줄 시점엔 이미 준비돼 있어서 체감 속도와 노출 성공률이 함께 올라가요.
 */
export function preloadFullScreenAd(adGroupId: string): void {
  if (!adGroupId || preloadCache.has(adGroupId)) return;
  preloadCache.set(adGroupId, loadAndWait(adGroupId));
}

/**
 * 전면형/보상형 통합 광고(adGroupId)를 노출해요.
 * preloadFullScreenAd로 미리 로드해둔 게 있으면 그 결과를 그대로 쓰고, 없으면 지금 바로 로드부터 시작해요.
 * adGroupId가 비어있으면(아직 콘솔에서 발급 전) 즉시 스킵돼요.
 */
export async function playFullScreenAd(adGroupId: string): Promise<PlayFullScreenAdResult> {
  if (!adGroupId) {
    return { earnedReward: false, shown: false };
  }

  const pending = preloadCache.get(adGroupId);
  preloadCache.delete(adGroupId);
  const loaded = await (pending ?? loadAndWait(adGroupId));
  if (!loaded) {
    return { earnedReward: false, shown: false };
  }

  return showAndWait(adGroupId);
}
