import type { RecipeCategory } from "./types";

interface CategoryStyle {
  /** 썸네일 타일 배경색 */
  tile: string;
  /** 상세 화면 히어로 배경색 */
  hero: string;
}

const CATEGORY_STYLES: Record<RecipeCategory, CategoryStyle> = {
  국물: { tile: "#FFD9C7", hero: "#FFF1EC" },
  "밥/면": { tile: "#BFEACB", hero: "#EAF7EE" },
  볶음: { tile: "#FFE79E", hero: "#FFF8E1" },
  "구이/전": { tile: "#FBC6C6", hero: "#FDECEC" },
  반찬: { tile: "#C6DCFF", hero: "#EAF2FF" },
  "디저트/기타": { tile: "#D9C9FF", hero: "#F4EEFF" },
};

const FALLBACK: CategoryStyle = CATEGORY_STYLES["디저트/기타"];

export function getCategoryStyle(category: RecipeCategory): CategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK;
}
