import { getCategoryStyle } from "../foodVisuals";
import type { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const style = getCategoryStyle(recipe.category);

  return (
    <button type="button" className="recipe-card" onClick={onClick}>
      <div className="recipe-card-thumb" style={{ background: style.tile }}>
        <span className="recipe-card-emoji">{recipe.emoji}</span>
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-header">
          <span className="recipe-card-title">{recipe.name}</span>
          <span className="recipe-card-badge">{recipe.difficulty}</span>
        </div>
        <p className="recipe-card-desc">{recipe.description}</p>
        <div className="recipe-card-meta">
          <span>⏱ {recipe.cookTimeMinutes}분</span>
          {recipe.neededIngredients.length > 0 && (
            <span>🛒 구매 필요 재료 {recipe.neededIngredients.length}개</span>
          )}
        </div>
      </div>
    </button>
  );
}
