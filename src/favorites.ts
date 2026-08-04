import { Storage } from "@apps-in-toss/web-framework";
import type { Recipe } from "./types";

const STORAGE_KEY = "fridge-favorites-v1";

export async function loadFavorites(): Promise<Recipe[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Recipe[];
  } catch {
    return [];
  }
}

async function saveFavorites(favorites: Recipe[]): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // 저장 실패해도 이번 세션 표시에는 지장 없게 무시해요.
  }
}

export async function addFavorite(recipe: Recipe): Promise<Recipe[]> {
  const current = await loadFavorites();
  if (current.some((item) => item.id === recipe.id)) return current;
  const next = [recipe, ...current];
  await saveFavorites(next);
  return next;
}

export async function removeFavorite(recipeId: string): Promise<Recipe[]> {
  const current = await loadFavorites();
  const next = current.filter((item) => item.id !== recipeId);
  await saveFavorites(next);
  return next;
}
