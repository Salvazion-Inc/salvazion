/**
 * Análisis de comidas por foto (Grok Vision).
 * Nutrientes, kcal y pirámide alimenticia (estilo USDA / guía clásica).
 */

import type { MealSlot } from './biomarkers';

export type FoodPyramidShare = {
  /** % de la porción visual / aporte estimado 0–100 */
  grains: number;
  vegetables: number;
  fruits: number;
  protein: number;
  dairy: number;
  fats: number;
  sugars: number;
};

export type MealVisionAnalysis = {
  foods: { name: string; portion: string }[];
  estimatedKcal: number | null;
  macros: {
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
  };
  microsSummary: string;
  /** Pirámide alimenticia (base = cereales/verduras; pico = azúcares) */
  pyramid: FoodPyramidShare;
  quality: 'whole' | 'mixed' | 'processed';
  kennedyNote: string;
  advice: string;
  confidence: 'low' | 'medium' | 'high';
};

export type MealPhotoEntry = {
  id: string;
  createdAt: string;
  date: string;
  slot: MealSlot;
  /** Compressed data URL */
  photoDataUrl: string;
  analysis: MealVisionAnalysis | null;
  model?: string | null;
  error?: string | null;
  /** If user applied to daily nutrition log */
  appliedToLog?: boolean;
};

const STORAGE = 'salvazion_meal_photos_v1';
const MAX_ENTRIES = 40;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadMealPhotos(): MealPhotoEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? (JSON.parse(raw) as MealPhotoEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: MealPhotoEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, MAX_ENTRIES)));
}

export function saveMealPhoto(entry: MealPhotoEntry): MealPhotoEntry[] {
  const list = loadMealPhotos().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  saveAll(list);
  return list;
}

export function deleteMealPhoto(id: string): MealPhotoEntry[] {
  const list = loadMealPhotos().filter((e) => e.id !== id);
  saveAll(list);
  return list;
}

export function createMealPhotoDraft(
  photoDataUrl: string,
  slot: MealSlot = 'lunch'
): MealPhotoEntry {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    date: today(),
    slot,
    photoDataUrl,
    analysis: null,
  };
}

export function emptyPyramid(): FoodPyramidShare {
  return {
    grains: 0,
    vegetables: 0,
    fruits: 0,
    protein: 0,
    dairy: 0,
    fats: 0,
    sugars: 0,
  };
}
