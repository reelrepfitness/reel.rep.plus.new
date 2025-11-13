import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FoodBankItem } from "@/lib/types";

import { createLogger } from '@/lib/logger';

const logger = createLogger('Usemealsdata');

export interface DailyItem {
  id: string;
  daily_log_id: string;
  food_id: number;
  meal_category: string;
  measure_type: string;
  quantity: number;
  grams: number;
  kcal: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  created_at: string;
  food_item?: FoodBankItem;
}

export interface MealData {
  mealType: string;
  items: DailyItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalVeg: number;
  totalFruit: number;
}

export function useMealsData() {
  const { user } = useAuth();
  const today = formatDate(new Date());

  const dailyItemsQuery = useQuery({
    queryKey: ["dailyItems", user?.user_id, today],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("No user");

      logger.info("[Meals] Fetching daily items for:", today, "user_id:", user.user_id);

      // First get the daily log for today
      const { data: dailyLog, error: logError } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("date", today)
        .single();

      if (logError) {
        logger.info("[Meals] No daily log found");
        return [];
      }

      // Get all daily items with food details
      const { data, error } = await supabase
        .from("daily_items")
        .select(`
          *,
          food_item:food_bank!daily_items_food_id_fkey(*)
        `)
        .eq("daily_log_id", dailyLog.id)
        .order("created_at", { ascending: true });

      if (error) {
        logger.error("[Meals] Error fetching daily items:", error);
        throw error;
      }

      logger.info(`[Meals] Loaded ${data?.length || 0} items`);
      return (data as DailyItem[]) || [];
    },
    enabled: !!user?.user_id,
  });

  const mealsByCategory: Record<string, MealData> = {
    "ארוחת בוקר": {
      mealType: "ארוחת בוקר",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalVeg: 0,
      totalFruit: 0,
    },
    "ארוחת ביניים": {
      mealType: "ארוחת ביניים",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalVeg: 0,
      totalFruit: 0,
    },
    "ארוחת צהריים": {
      mealType: "ארוחת צהריים",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalVeg: 0,
      totalFruit: 0,
    },
    "ארוחת ערב": {
      mealType: "ארוחת ערב",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalVeg: 0,
      totalFruit: 0,
    },
  };

  // Group items by meal category
  dailyItemsQuery.data?.forEach((item) => {
    const meal = mealsByCategory[item.meal_category];
    if (meal) {
      meal.items.push(item);
      meal.totalCalories += item.kcal || 0;
      meal.totalProtein += item.protein_units || 0;
      meal.totalCarbs += item.carb_units || 0;
      meal.totalFats += item.fat_units || 0;
      meal.totalVeg += item.veg_units || 0;
      meal.totalFruit += item.fruit_units || 0;
    }
  });

  return {
    meals: Object.values(mealsByCategory),
    isLoading: dailyItemsQuery.isLoading,
  };
}
