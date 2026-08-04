import { RecipeCard } from "../components/RecipeCard";
import type { Recipe } from "../types";

interface FavoritesProps {
  favorites: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export function Favorites({ favorites, onSelectRecipe, onBack }: FavoritesProps) {
  return (
    <div className="screen">
      <button type="button" className="back-button" onClick={onBack}>
        ← 홈으로
      </button>

      <p className="recipe-detail-title">즐겨찾기</p>

      {favorites.length === 0 && <p className="history-empty">아직 즐겨찾기한 레시피가 없어요. 레시피 상세에서 ⭐을 눌러보세요.</p>}

      <div className="result-recipes">
        {favorites.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onSelectRecipe(recipe)} />
        ))}
      </div>
    </div>
  );
}
