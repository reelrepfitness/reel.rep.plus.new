import { I18nManager } from "react-native";
import { FoodConversions, MeasureType, CATEGORY_KCAL_PER_UNIT } from "./types";

export const isRTL = true; 

export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function convertToGrams(
  conversions: FoodConversions,
  measureType: MeasureType,
  quantity: number
): number {
  switch (measureType) {
    case "grams":
      return quantity;
    case "unit":
      return (conversions.grams_per_unit || 0) * quantity;
    case "cup":
      return (conversions.grams_per_cup || 0) * quantity;
    case "tbsp":
      return (conversions.grams_per_tbsp || 0) * quantity;
    case "tsp":
      return (conversions.grams_per_tsp || 0) * quantity;
    default:
      return 0;
  }
}

export function calculateCalories(
  kcalPer100g: number,
  grams: number
): number {
  return (kcalPer100g / 100) * grams;
}

export function calculateUnits(
  kcal: number,
  category: string
): number {
  const kcalPerUnit = CATEGORY_KCAL_PER_UNIT[category as keyof typeof CATEGORY_KCAL_PER_UNIT] || 120;
  return roundToHalf(kcal / kcalPerUnit);
}

export function getAvailableMeasures(conversions: FoodConversions): MeasureType[] {
  const measures: MeasureType[] = ["grams"];
  
  if (conversions.grams_per_unit !== null && conversions.grams_per_unit !== undefined) {
    measures.push("unit");
  }
  if (conversions.grams_per_cup !== null && conversions.grams_per_cup !== undefined) {
    measures.push("cup");
  }
  if (conversions.grams_per_tbsp !== null && conversions.grams_per_tbsp !== undefined) {
    measures.push("tbsp");
  }
  if (conversions.grams_per_tsp !== null && conversions.grams_per_tsp !== undefined) {
    measures.push("tsp");
  }
  
  return measures;
}

export function buildConversionText(conversions: FoodConversions): string {
  const parts: string[] = [];
  
  if (conversions.grams_per_unit) {
    parts.push(`1 יחידה = ${conversions.grams_per_unit} ג'`);
  }
  if (conversions.grams_per_cup) {
    parts.push(`1 כוס = ${conversions.grams_per_cup} ג'`);
  }
  if (conversions.grams_per_tbsp) {
    parts.push(`1 כף = ${conversions.grams_per_tbsp} ג'`);
  }
  if (conversions.grams_per_tsp) {
    parts.push(`1 כפית = ${conversions.grams_per_tsp} ג'`);
  }
  
  return parts.join(" | ");
}

// Re-export timezone-aware date functions from dateUtils
// These handle Israel timezone (Asia/Jerusalem) properly
export {
  formatDate,
  formatDateHebrew,
  formatTime,
  formatDateTime,
  formatRelative,
  nowInIsrael,
  isToday,
  parseISOInIsrael,
  getHebrewDayName,
  getHebrewMonthName
} from './dateUtils';
