import { Button } from "@toss/tds-mobile";
import { useEffect, useState } from "react";
import { BannerAd } from "../components/BannerAd";
import { IngredientChip } from "../components/IngredientChip";
import { PartnersDisclosure } from "../components/PartnersDisclosure";
import { RecipeCard } from "../components/RecipeCard";
import { AD_GROUP_IDS } from "../adConfig";
import { fetchMoreRecipes } from "../api";
import { playFullScreenAd, preloadFullScreenAd } from "../hooks/useFullScreenAd";
import { shareChallenge } from "../share";
import type { AnalyzeResult, Recipe } from "../types";

interface ResultProps {
  result: AnalyzeResult;
  isDemo?: boolean;
  demoLabel?: string;
  /** 실제 분석 사진의 base64예요. 데모 모드에서는 없어요(추가 레시피 재생성에 필요). */
  imageBase64?: string;
  onSelectRecipe: (recipe: Recipe) => void;
  onRetake: () => void;
}

export function Result({ result, isDemo, demoLabel, imageBase64, onSelectRecipe, onRetake }: ResultProps) {
  const [bonusRecipes, setBonusRecipes] = useState<Recipe[]>([]);
  const [loadingBonus, setLoadingBonus] = useState(false);
  const [bonusError, setBonusError] = useState(false);
  const [sharing, setSharing] = useState(false);

  const allRecipes = [...result.recipes, ...bonusRecipes];
  // 데모 화면엔 실제 사진이 없어서 추가 레시피를 새로 생성할 수 없어요 -> 보상형 버튼 자체를 숨겨요.
  const canWatchAdForMore = !isDemo && !!imageBase64 && bonusRecipes.length === 0 && !!AD_GROUP_IDS.reward;

  useEffect(() => {
    // 버튼을 누르기 전에 미리 로드해두면, 실제로 누를 때 대기 없이 바로 노출돼요.
    if (canWatchAdForMore) preloadFullScreenAd(AD_GROUP_IDS.reward);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWatchAdForMore = async () => {
    if (!imageBase64 || loadingBonus) return;
    setLoadingBonus(true);
    setBonusError(false);
    const { earnedReward } = await playFullScreenAd(AD_GROUP_IDS.reward);
    if (earnedReward) {
      try {
        const existingNames = result.recipes.map((recipe) => recipe.name);
        const moreRecipes = await fetchMoreRecipes(imageBase64, existingNames);
        setBonusRecipes(moreRecipes);
      } catch {
        setBonusError(true);
      }
    } else {
      setBonusError(true);
    }
    setLoadingBonus(false);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareChallenge(result.recipes[0]?.name ?? "오늘의 레시피", Boolean(isDemo));
    } catch {
      // 토스 앱 밖(브라우저 미리보기 등)에서는 공유 브릿지가 없어서 실패할 수 있어요.
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="screen">
      {isDemo && (
        <div className="demo-banner">
          👀 "{demoLabel}" 예시 화면이에요. 실제로는 내 냉장고 사진으로 분석해드려요.
        </div>
      )}
      <div className="result-header">
        <p className="result-title">이런 재료를 찾았어요</p>
        <div className="ingredient-list">
          {result.ingredients.map((ingredient) => (
            <IngredientChip key={ingredient} label={ingredient} />
          ))}
        </div>
      </div>

      <div className="result-recipes">
        <p className="result-title">추천 레시피</p>
        {allRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onSelectRecipe(recipe)} />
        ))}
      </div>

      {canWatchAdForMore && (
        <>
          <Button variant="weak" display="full" size="large" loading={loadingBonus} onClick={handleWatchAdForMore}>
            🎁 광고 보고 새 레시피 더 받기
          </Button>
          {bonusError && <p className="bonus-error-hint">광고를 끝까지 봐야 새 레시피를 받을 수 있어요. 다시 시도해주세요.</p>}
        </>
      )}

      <Button variant="weak" display="full" size="large" loading={sharing} onClick={handleShare}>
        🧊 냉장고 파먹기 챌린지 공유하기
      </Button>

      <Button variant="weak" display="full" size="large" onClick={onRetake}>
        {isDemo ? "내 냉장고로 직접 해보기" : "다시 촬영하기"}
      </Button>

      <BannerAd variant="expanded" />
      <PartnersDisclosure />
    </div>
  );
}
