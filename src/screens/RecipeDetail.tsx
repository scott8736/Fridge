import { Button } from "@toss/tds-mobile";
import { openURL } from "@apps-in-toss/web-framework";
import { useState } from "react";
import { PartnersDisclosure } from "../components/PartnersDisclosure";
import { getCoupangPartnersLink } from "../api";
import { getCategoryStyle } from "../foodVisuals";
import type { Recipe } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  const [loadingKeyword, setLoadingKeyword] = useState<string | null>(null);
  const style = getCategoryStyle(recipe.category);

  const handleBuyIngredient = async (ingredient: string) => {
    if (loadingKeyword) return;
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
      <button type="button" className="back-button" onClick={onBack}>
        ← 목록으로
      </button>

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

      <PartnersDisclosure />
    </div>
  );
}
