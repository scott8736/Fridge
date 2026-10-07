import { Button } from "@toss/tds-mobile";
import { openURL } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { BannerAd } from "../components/BannerAd";
import { PartnersDisclosure } from "../components/PartnersDisclosure";
import { getCoupangPartnersLink } from "../api";
import { logClick } from "../analytics";
import { addFavorite, loadFavorites, removeFavorite } from "../favorites";
import { getCategoryStyle } from "../foodVisuals";
import type { Recipe } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  const [loadingKeyword, setLoadingKeyword] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const style = getCategoryStyle(recipe.category);

  useEffect(() => {
    loadFavorites().then((favorites) => setIsFavorite(favorites.some((item) => item.id === recipe.id)));
  }, [recipe.id]);

  const handleToggleFavorite = async () => {
    logClick("toggle_favorite", { on: !isFavorite });
    if (isFavorite) {
      await removeFavorite(recipe.id);
      setIsFavorite(false);
    } else {
      await addFavorite(recipe);
      setIsFavorite(true);
    }
  };

  const handleBuyIngredient = async (ingredient: string) => {
    if (loadingKeyword) return;
    logClick("coupang_click", { ingredient });
    setLoadingKeyword(ingredient);
    try {
      const url = await getCoupangPartnersLink(ingredient);
      await openURL(url);
    } catch {
      // 링크 발급에 실패해도 화면은 그대로 유지하고, 버튼만 원상복구해요.
    } finally {
      setLoadingKeyword(null);
    }
  };

  return (
    <div className="screen">
      <div className="recipe-detail-top-row">
        <button type="button" className="back-button" onClick={onBack}>
          ← 목록으로
        </button>
        <button
          type="button"
          className={`favorite-toggle ${isFavorite ? "favorite-toggle-active" : ""}`}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? "⭐ 즐겨찾기됨" : "☆ 즐겨찾기"}
        </button>
      </div>

      <div className="recipe-hero" style={{ background: style.hero }}>
        <span className="recipe-hero-emoji">{recipe.emoji}</span>
      </div>

      <p className="recipe-detail-title">{recipe.name}</p>
      <p className="recipe-detail-desc">{recipe.description}</p>
      <div className="recipe-card-meta">
        <span>⏱ {recipe.cookTimeMinutes}분</span>
        <span>난이도 {recipe.difficulty}</span>
      </div>

      {recipe.neededIngredients.length > 0 && (
        <section className="recipe-section">
          <p className="recipe-section-title">🛒 구매가 필요한 재료</p>
          <ul className="buy-ingredient-list">
            {recipe.neededIngredients.map((ingredient) => (
              <li key={ingredient} className="buy-ingredient-row">
                <span>{ingredient}</span>
                <Button
                  variant="weak"
                  size="small"
                  loading={loadingKeyword === ingredient}
                  onClick={() => handleBuyIngredient(ingredient)}
                >
                  구매하기
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.prepNotes.length > 0 && (
        <section className="recipe-section">
          <p className="recipe-section-title">재료 손질법</p>
          <ul className="plain-list">
            {recipe.prepNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="recipe-section">
        <p className="recipe-section-title">조리 순서</p>
        <ol className="step-list">
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <BannerAd variant="expanded" />
      <PartnersDisclosure />
    </div>
  );
}
