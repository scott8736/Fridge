import { RecipeCard } from "../components/RecipeCard";
import { groupHistoryByDate, type HistoryEntry } from "../history";
import type { Recipe } from "../types";

interface HistoryProps {
  entries: HistoryEntry[];
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export function History({ entries, onSelectRecipe, onBack }: HistoryProps) {
  const groups = groupHistoryByDate(entries);

  return (
    <div className="screen">
      <button type="button" className="back-button" onClick={onBack}>
        ← 홈으로
      </button>

      <p className="recipe-detail-title">지난 기록</p>

      {groups.length === 0 && <p className="history-empty">아직 촬영 기록이 없어요. 냉장고를 찍으면 여기에 쌓여요.</p>}

      {groups.map((group) => (
        <section key={group.label} className="recipe-section">
          <p className="recipe-section-title">{group.label}</p>
          {group.entries.map((entry) =>
            entry.recipes.map((recipe) => (
              <RecipeCard key={`${entry.id}-${recipe.id}`} recipe={recipe} onClick={() => onSelectRecipe(recipe)} />
            )),
          )}
        </section>
      ))}
    </div>
  );
}
