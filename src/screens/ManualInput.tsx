import { Button, Top } from "@toss/tds-mobile";
import { useState } from "react";
import { IngredientChip } from "../components/IngredientChip";

interface ManualInputProps {
  onSubmit: (ingredients: string[]) => void;
}

export function ManualInput({ onSubmit }: ManualInputProps) {
  const [draft, setDraft] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);

  const addIngredient = () => {
    const value = draft.trim();
    if (!value || ingredients.includes(value)) {
      setDraft("");
      return;
    }
    setIngredients((prev) => [...prev, value]);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  };

  return (
    <div className="screen">

      <Top
        title={<Top.TitleParagraph size={22}>냉장고에 있는 재료를{"\n"}적어주세요</Top.TitleParagraph>}
        subtitleBottom={<Top.SubtitleParagraph size={17}>사진이 없어도 재료 이름만으로 추천해드려요.</Top.SubtitleParagraph>}
      />

      <div className="manual-input-row">
        <input
          className="manual-input-field"
          type="text"
          value={draft}
          placeholder="예: 계란, 대파, 김치"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="weak" size="large" onClick={addIngredient}>
          추가
        </Button>
      </div>

      {ingredients.length > 0 && (
        <div className="ingredient-list">
          {ingredients.map((ingredient) => (
            <IngredientChip
              key={ingredient}
              label={ingredient}
              onRemove={() => setIngredients((prev) => prev.filter((item) => item !== ingredient))}
            />
          ))}
        </div>
      )}

      <Button
        variant="fill"
        display="full"
        size="xlarge"
        disabled={ingredients.length === 0}
        onClick={() => onSubmit(ingredients)}
      >
        이 재료로 레시피 추천받기
      </Button>
    </div>
  );
}
