import type { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <button type="button" className="recipe-card" onClick={onClick}>
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
    </button>
  );
}
