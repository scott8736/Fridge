import { Storage } from "@apps-in-toss/web-framework";
import type { AnalyzeResult, Recipe } from "./types";

export interface HistoryEntry {
  id: string;
  /** ISO 8601 문자열 */
  date: string;
  ingredients: string[];
  recipes: Recipe[];
}

const STORAGE_KEY = "fridge-history-v1";
/** 저장소가 무한정 커지지 않도록 최근 기록만 남겨요. */
const MAX_ENTRIES = 30;

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function addHistoryEntry(result: AnalyzeResult): Promise<HistoryEntry[]> {
  const entry: HistoryEntry = {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    ingredients: result.ingredients,
    recipes: result.recipes,
  };

  const current = await loadHistory();
  const next = [entry, ...current].slice(0, MAX_ENTRIES);

  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 이번 세션 화면 표시에는 지장 없게 그냥 무시해요.
  }

  return next;
}

/** 날짜(YYYY-MM-DD, 한국어 표기)별로 묶어서 반환해요. */
export function groupHistoryByDate(entries: HistoryEntry[]): { label: string; entries: HistoryEntry[] }[] {
  const groups = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    const list = groups.get(label) ?? [];
    list.push(entry);
    groups.set(label, list);
  }

  return [...groups.entries()].map(([label, entries]) => ({ label, entries }));
}
