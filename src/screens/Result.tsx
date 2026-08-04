import { Button } from "@toss/tds-mobile";
import { useState } from "react";
import { BannerAd } from "../components/BannerAd";
import { IngredientChip } from "../components/IngredientChip";
import { PartnersDisclosure } from "../components/PartnersDisclosure";
import { RecipeCard } from "../components/RecipeCard";
import { AD_GROUP_IDS } from "../adConfig";
import { playFullScreenAd } from "../hooks/useFullScreenAd";
import type { AnalyzeResult, Recipe } from "../types";

interface ResultProps {
  result: AnalyzeResult;
  onSelectRecipe: (recipe: Recipe) => void;
  onRetake: () => void;
}

export function Result({ result, onSelectRecipe, onRetake }: ResultProps) {
  const [bonusRecipes, setBonusRecipes] = useState<Recipe[]>([]);
  const [loadingBonus, setLoadingBonus] = useState(false);

  const allRecipes = [...result.recipes, ...bonusRecipes];
  const hasMore = bonusRecipes.length === 0 && result.recipes.length > 0;

  const handleWatchAdForMore = async () => {
    if (!AD_GROUP_IDS.reward || loadingBonus) return;
    setLoadingBonus(true);
    const { earnedReward } = await playFullScreenAd(AD_GROUP_IDS.reward);
    if (earnedReward) {
      // 광고 시청 보상으로, 이미 추천된 레시피 목록에서 아직 안 보여준 나머지를 추가로 열어줘요.
      setBonusRecipes(result.recipes.slice(2));
    }
    setLoadingBonus(false);
  };

  return (
    <div className="screen">
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

      {hasMore && AD_GROUP_IDS.reward && (
        <Button variant="weak" display="full" size="large" loading={loadingBonus} onClick={handleWatchAdForMore}>
          🎁 광고 보고 레시피 더보기
        </Button>
      )}

      <Button variant="weak" display="full" size="large" onClick={onRetake}>
        다시 촬영하기
      </Button>

      <BannerAd />
      <PartnersDisclosure />
    </div>
  );
}
