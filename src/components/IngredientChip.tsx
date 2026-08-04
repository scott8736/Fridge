interface IngredientChipProps {
  label: string;
  onRemove?: () => void;
}

export function IngredientChip({ label, onRemove }: IngredientChipProps) {
  if (!onRemove) {
    return <span className="ingredient-chip">{label}</span>;
  }

  return (
    <button type="button" className="ingredient-chip ingredient-chip-removable" onClick={onRemove}>
      {label} <span aria-hidden="true">✕</span>
    </button>
  );
}
