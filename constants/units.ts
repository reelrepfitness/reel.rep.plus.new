export const UNIT_CALORIES = {
  protein: 200,
  carb: 120,
  fat: 120,
  vegetable: 35,
  fruit: 85,
} as const;

export type CategoryType = keyof typeof UNIT_CALORIES;

export function calculateUnits(calories: number, category: CategoryType): number {
  const caloriesPerUnit = UNIT_CALORIES[category];
  const units = calories / caloriesPerUnit;
  return Math.round(units * 2) / 2;
}
