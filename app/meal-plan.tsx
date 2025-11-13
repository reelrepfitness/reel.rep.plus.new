import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";
import { useHomeData } from "@/lib/useHomeData";
import { FoodBankItem } from "@/lib/types";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('MealPlan');

interface MealPlanItem {
  id: string;
  food_id: number;
  meal_category: string;
  quantity: number;
  kcal: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  food_item?: FoodBankItem;
}

interface MealPlan {
  mealType: string;
  items: MealPlanItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalVeg: number;
  totalFruit: number;
}

export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { dailyLog } = useHomeData();
  const queryClient = useQueryClient();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const mealNames = {
    "ארוחת בוקר": "ארוחת בוקר",
    "ארוחת ביניים": "ארוחת ביניים",
    "ארוחת צהריים": "ארוחת צהריים",
    "ארוחת ערב": "ארוחת ערב",
  };

  const { data: mealPlanItems = [], isLoading } = useQuery({
    queryKey: ["mealPlan", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];

      logger.info("[MealPlan] Fetching meal plan for user:", user.user_id);

      const { data, error } = await supabase
        .from("meal_plan_items")
        .select(`
          *,
          food_item:food_id (
            id,
            name,
            img_url,
            category,
            sub_category,
            caloreis_per_unit,
            protien_units,
            carb_units,
            fats_units,
            veg_units,
            fruit_units
          )
        `)
        .eq("user_id", user.user_id)
        .order("meal_category", { ascending: true });

      if (error) {
        logger.error("[MealPlan] Error fetching meal plan:", error);
        throw error;
      }

      logger.info(`[MealPlan] Loaded ${data?.length || 0} meal plan items`);
      return data as MealPlanItem[];
    },
    enabled: !!user?.user_id,
  });

  const mealPlans: MealPlan[] = Object.keys(mealNames).map((mealType) => {
    const items = mealPlanItems.filter(
      (item) => item.meal_category === mealType
    );

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.kcal,
        protein: acc.protein + item.protein_units,
        carbs: acc.carbs + item.carb_units,
        fats: acc.fats + item.fat_units,
        veg: acc.veg + item.veg_units,
        fruit: acc.fruit + item.fruit_units,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, veg: 0, fruit: 0 }
    );

    return {
      mealType,
      items,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
      totalVeg: totals.veg,
      totalFruit: totals.fruit,
    };
  });

  const addToDailyIntakeMutation = useMutation({
    mutationFn: async (item: MealPlanItem) => {
      if (!dailyLog?.id) throw new Error("No daily log found");

      logger.info("[MealPlan] Adding item to daily intake:", item.food_item?.name);

      const { error } = await supabase.from("daily_items").insert([
        {
          daily_log_id: dailyLog.id,
          food_id: item.food_id,
          meal_category: item.meal_category,
          measure_type: "unit",
          quantity: item.quantity,
          grams: 0,
          kcal: item.kcal,
          protein_units: item.protein_units,
          carb_units: item.carb_units,
          fat_units: item.fat_units,
          veg_units: item.veg_units,
          fruit_units: item.fruit_units,
        },
      ]);

      if (error) throw error;

      return item;
    },
    onSuccess: (item) => {
      setCheckedItems((prev) => new Set(prev).add(item.id));
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
      
      setTimeout(() => {
        setCheckedItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 2000);
    },
    onError: (error) => {
      logger.error("[MealPlan] Error adding to daily intake:", error);
    },
  });

  const handleCheckboxPress = (item: MealPlanItem) => {
    if (checkedItems.has(item.id)) return;
    addToDailyIntakeMutation.mutate(item);
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
          {Platform.OS === "web" ? (
            <View style={styles.headerGlassWeb} />
          ) : (
            <View style={styles.headerGlass} />
          )}

          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>התפריט שלי</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {mealPlans.map((meal) => {
            if (meal.items.length === 0) return null;

            const hasTotalIntake =
              meal.totalCalories > 0 ||
              meal.totalProtein > 0 ||
              meal.totalCarbs > 0 ||
              meal.totalFats > 0 ||
              meal.totalVeg > 0 ||
              meal.totalFruit > 0;

            const mealMacroCards = [
              {
                key: "calories",
                label: "קלוריות",
                value: meal.totalCalories,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
                isCalories: true,
              },
              {
                key: "protein",
                label: "חלבון",
                value: meal.totalProtein,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984933/steak_mlurou.webp",
                isCalories: false,
              },
              {
                key: "carb",
                label: "פחמימות",
                value: meal.totalCarbs,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984890/bread-slice_dxwpxq.webp",
                isCalories: false,
              },
              {
                key: "fat",
                label: "שומנים",
                value: meal.totalFats,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984882/avocado_2_brovfe.webp",
                isCalories: false,
              },
              {
                key: "veg",
                label: "ירקות",
                value: meal.totalVeg,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921406/broccoli_6_esjw1f.webp",
                isCalories: false,
              },
              {
                key: "fruit",
                label: "פירות",
                value: meal.totalFruit,
                icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921407/apple_3_r7sndm.webp",
                isCalories: false,
              },
            ];

            return (
              <View
                key={meal.mealType}
                style={[
                  styles.mealCard,
                  !hasTotalIntake && styles.mealCardInactive,
                ]}
              >
                <View style={styles.mealHeader}>
                  <Text
                    style={[
                      styles.mealTitle,
                      !hasTotalIntake && styles.mealTitleInactive,
                    ]}
                  >
                    {meal.mealType}
                  </Text>
                </View>

                <View style={styles.foodItemsList}>
                  {meal.items.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    const isPending = addToDailyIntakeMutation.isPending;

                    return (
                      <View key={item.id} style={styles.foodItemCard}>
                        <TouchableOpacity
                          style={[
                            styles.checkbox,
                            isChecked && styles.checkboxChecked,
                          ]}
                          onPress={() => handleCheckboxPress(item)}
                          activeOpacity={0.7}
                          disabled={isPending || isChecked}
                        >
                          {isChecked && (
                            <Check size={16} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </TouchableOpacity>

                        <View style={styles.foodItemContent}>
                          {item.food_item?.img_url && (
                            <Image
                              source={{ uri: item.food_item.img_url }}
                              style={styles.foodItemImage}
                              resizeMode="cover"
                            />
                          )}

                          <View style={styles.foodItemInfo}>
                            <Text style={styles.foodItemName} numberOfLines={2}>
                              {item.food_item?.name || "מזון"}
                            </Text>

                            <View style={styles.foodItemDetails}>
                              <Text style={styles.foodItemQuantity}>
                                כמות: {formatUnit(item.quantity)}
                              </Text>
                              <Text style={styles.foodItemCalories}>
                                {Math.round(item.kcal)} קל&apos;
                              </Text>
                            </View>

                            <View style={styles.foodItemMacros}>
                              {item.protein_units > 0 && (
                                <View
                                  style={[
                                    styles.nutritionBadge,
                                    {
                                      backgroundColor: `${colors.protein}30`,
                                    },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp",
                                    }}
                                    style={styles.nutritionIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.nutritionText}>
                                    {formatUnit(item.protein_units)}
                                  </Text>
                                </View>
                              )}
                              {item.carb_units > 0 && (
                                <View
                                  style={[
                                    styles.nutritionBadge,
                                    { backgroundColor: `${colors.carb}30` },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp",
                                    }}
                                    style={styles.nutritionIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.nutritionText}>
                                    {formatUnit(item.carb_units)}
                                  </Text>
                                </View>
                              )}
                              {item.fat_units > 0 && (
                                <View
                                  style={[
                                    styles.nutritionBadge,
                                    { backgroundColor: `${colors.fat}30` },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp",
                                    }}
                                    style={styles.nutritionIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.nutritionText}>
                                    {formatUnit(item.fat_units)}
                                  </Text>
                                </View>
                              )}
                              {item.veg_units > 0 && (
                                <View
                                  style={[
                                    styles.nutritionBadge,
                                    {
                                      backgroundColor: `${colors.vegetable}30`,
                                    },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp",
                                    }}
                                    style={styles.nutritionIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.nutritionText}>
                                    {formatUnit(item.veg_units)}
                                  </Text>
                                </View>
                              )}
                              {item.fruit_units > 0 && (
                                <View
                                  style={[
                                    styles.nutritionBadge,
                                    { backgroundColor: `${colors.fruit}30` },
                                  ]}
                                >
                                  <Image
                                    source={{
                                      uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp",
                                    }}
                                    style={styles.nutritionIcon}
                                    resizeMode="contain"
                                  />
                                  <Text style={styles.nutritionText}>
                                    {formatUnit(item.fruit_units)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.mealMacroCardsContainer}>
                  {mealMacroCards.map((macro, index) => {
                    const isBlackedOut = macro.value === 0;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.mealMacroCard,
                          macro.isCalories && styles.mealMacroCardCalories,
                          isBlackedOut && styles.mealMacroCardBlackedOut,
                        ]}
                      >
                        <Text
                          style={[
                            styles.mealMacroValue,
                            isBlackedOut && styles.mealMacroValueBlackedOut,
                          ]}
                        >
                          {formatUnit(macro.value)}
                        </Text>
                        {macro.icon ? (
                          <Image
                            source={{ uri: macro.icon }}
                            style={[
                              styles.mealMacroIcon,
                              isBlackedOut && styles.mealMacroIconBlackedOut,
                            ]}
                            resizeMode="contain"
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },
  stickyHeader: {
    backgroundColor: "transparent",
    position: "relative" as const,
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  headerGlass: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  headerGlassWeb: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  headerContent: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mealCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  mealCardInactive: {
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderColor: "rgba(150, 150, 150, 0.3)",
    opacity: 0.6,
  },
  mealHeader: {
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
  },
  mealTitleInactive: {
    color: "#000000",
  },
  foodItemsList: {
    gap: 12,
    marginBottom: 16,
  },
  foodItemCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  foodItemContent: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
  },
  foodItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  foodItemInfo: {
    flex: 1,
    gap: 6,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
  },
  foodItemDetails: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 12,
  },
  foodItemQuantity: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  foodItemCalories: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  foodItemMacros: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    gap: 4,
  },
  nutritionBadge: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nutritionIcon: {
    width: 12,
    height: 12,
  },
  nutritionText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  mealMacroCardsContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 6,
    flexWrap: "wrap",
  },
  mealMacroCard: {
    flex: 1,
    minWidth: "15%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
    position: "relative" as const,
  },
  mealMacroCardCalories: {
    flex: 1.5,
  },
  mealMacroCardBlackedOut: {
    opacity: 0.15,
  },
  mealMacroValue: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  mealMacroValueBlackedOut: {
    color: "#FFFFFF",
  },
  mealMacroIcon: {
    width: 22,
    height: 22,
  },
  mealMacroIconBlackedOut: {
    opacity: 1,
  },
});
