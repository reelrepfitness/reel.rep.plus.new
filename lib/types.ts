export type UserRole = "user" | "coach" | "admin";

export interface User {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  kcal_goal: number | null;
  protein_units: number | null;
  carb_units: number | null;
  fat_units: number | null;
  veg_units: number | null;
  fruit_units: number | null;
  target_template_id?: string | null;
  targets_override: boolean;
  body_weight?: number | null;
  height?: number | null;
  water_daily_goal?: number | null;
  whatsapp_link?: string | null;
  weekly_cardio_minutes?: number | null;
  weekly_strength_workouts?: number | null;
  gender?: string | null;
  goal?: string | null;
  phone?: string | null;
  age?: string | null;
  activity?: string | null;
  profile_picture?: string | null;
  food_limitations?: string | null;
  users_notes?: string | null;
  meal_plan?: boolean | null;
  "meal_plan?"?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTargets {
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
}

export type FoodCategory =
  | "protein"
  | "carb"
  | "fat"
  | "vegetable"
  | "fruit"
  | "spread"
  | "restaurant"
  | "alcohol";

export interface FoodConversions {
  grams_per_unit?: number | null;
  grams_per_cup?: number | null;
  grams_per_tbsp?: number | null;
  grams_per_tsp?: number | null;
}

export type MeasureType = "grams" | "unit" | "cup" | "tbsp" | "tsp";

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  kcal_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  default_qty_grams: number;
  default_household_desc?: string;
  conversions_json: FoodConversions;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  totals_per_category: {
    protein: number;
    carb: number;
    fat: number;
    vegetable: number;
    fruit: number;
  };
  total_kcal: number;
  created_at: string;
  updated_at: string;
}

export interface DailyItem {
  id: string;
  daily_log_id: string;
  food_id: string;
  measure_type: MeasureType;
  quantity: number;
  kcal: number;
  units: number;
  food_item?: FoodItem;
  created_at: string;
}

export interface TargetTemplate {
  id: string;
  kcal_plan: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients_json: {
    food_id: string;
    quantity: number;
    measure_type: MeasureType;
  }[];
  total_kcal: number;
  total_units: {
    protein: number;
    carb: number;
    fat: number;
    vegetable: number;
    fruit: number;
  };
  created_at: string;
}

// Food Bank item matching exact Supabase column names
export interface FoodBankItem {
  id: number;
  name: string;
  img_url: string | null;
  category: string;
  sub_category: string | null;
  caloreis_per_unit: number; // Note: intentional misspelling to match DB
  protien_units: number; // Note: intentional misspelling to match DB
  carb_units: number;
  fats_units: number; // Note: "fats" not "fat"
  veg_units: number;
  fruit_units: number;
  veg_unit: string | null; // Unit name for vegetables (e.g. "גרם", "כוס")
  fruit_unit: string | null; // Unit name for fruits (e.g. "גרם", "כוס")
  grams_per_single_item: number | null;
  items_per_unit: number | null;
  grams_per_cup: number | null;
  grams_per_tbsp: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_KCAL_PER_UNIT: Record<FoodCategory, number> = {
  protein: 200,
  carb: 120,
  fat: 120,
  vegetable: 35,
  fruit: 85,
  spread: 120,
  restaurant: 120,
  alcohol: 120,
};

export const MEASURE_LABELS: Record<MeasureType, string> = {
  grams: "גרם",
  unit: "יחידה",
  cup: "כוס",
  tbsp: "כף",
  tsp: "כפית",
};

export interface Guide {
  guide_id: string;
  title: string;
  short_description: string | null;
  content: string;
  image_url: string | null;
  text_color: string | null;
  emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measurement_date: string;
  body_weight?: number | null;
  body_fat_mass?: number | null;
  lean_mass?: number | null;
  body_fat_percentage?: number | null;
  shoulder_circumference?: number | null;
  waist_circumference?: number | null;
  arm_circumference?: number | null;
  thigh_circumference?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: number;
  name: string;
  img_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantMenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  icon_name: string | null;
  calories_per_unit: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
