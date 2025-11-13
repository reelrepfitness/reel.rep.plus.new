import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";
import { FoodBankItem } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate, isRTL } from "@/lib/utils";

import { createLogger } from '@/lib/logger';

const logger = createLogger('Favorites');

export default function FavoritesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const mealType = (params.mealType as string) || "";
  const queryClient = useQueryClient();

  const [favorites, setFavorites] = useState<FoodBankItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);

  useEffect(() => {
    loadFavorites();
  }, [user?.user_id]);

  const loadFavorites = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("favorites")
        .select("food_id, food_bank(*)")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const favoriteFoods = data
        ?.map((fav: any) => fav.food_bank)
        .filter((food: any) => food !== null) as FoodBankItem[];

      setFavorites(favoriteFoods || []);
    } catch (error: any) {
      logger.error("Error loading favorites:", error);
      setError(error?.message || "שגיאה בטעינת מועדפים");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMeal = async (item: FoodBankItem) => {
    if (!user?.user_id || !mealType || addingItemId) return;

    try {
      setAddingItemId(item.id);
      const today = formatDate(new Date());

      let { data: dailyLog, error: logError } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", user.user_id)
        .eq("date", today)
        .single();

      if (logError && logError.code === "PGRST116") {
        const { data: newLog, error: insertError } = await supabase
          .from("daily_logs")
          .insert({
            user_id: user.user_id,
            date: today,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        dailyLog = newLog;
      } else if (logError) {
        throw logError;
      }

      if (!dailyLog) throw new Error("Failed to get or create daily log");

      const defaultQuantity = 1;
      const gramsPerUnit = item.grams_per_single_item || 100;
      const totalGrams = defaultQuantity * gramsPerUnit;

      const { error: insertError } = await supabase.from("daily_items").insert({
        daily_log_id: dailyLog.id,
        food_id: item.id,
        meal_category: mealType,
        measure_type: "unit",
        quantity: defaultQuantity,
        grams: totalGrams,
        kcal: item.caloreis_per_unit * defaultQuantity,
        protein_units: item.protien_units * defaultQuantity,
        carb_units: item.carb_units * defaultQuantity,
        fat_units: item.fats_units * defaultQuantity,
        veg_units: item.veg_units * defaultQuantity,
        fruit_units: item.fruit_units * defaultQuantity,
      });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      router.back();
    } catch (error: any) {
      logger.error("Error adding item to meal:", error);
      setError(error?.message || "שגיאה בהוספת פריט");
    } finally {
      setAddingItemId(null);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3FCDD1", "#FFFFFF"]}
      locations={[0, 0.4]}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.customHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow1}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Heart color={colors.white} size={28} fill={colors.white} />
          <View style={styles.backButton} />
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.customHeaderTitle}>מועדפים</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart color={colors.gray} size={64} />
            <Text style={styles.emptyTitle}>אין מועדפים עדיין</Text>
            <Text style={styles.emptySubtitle}>
              המזונות המועדפים שלך יופיעו כאן
            </Text>
          </View>
        ) : (
          <View style={styles.foodGrid}>
            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                onPress={() => mealType && handleAddToMeal(item)}
                activeOpacity={0.7}
                disabled={addingItemId !== null}
              >
                {item.img_url ? (
                  <Image source={{ uri: item.img_url }} style={styles.foodImage} />
                ) : (
                  <View style={[styles.foodImage, styles.foodImagePlaceholder]}>
                    <Heart color={colors.primary} size={32} />
                  </View>
                )}
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.foodCalories}>{item.caloreis_per_unit} קק״ל</Text>
                </View>
                {addingItemId === item.id && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
                <View style={styles.favoriteIcon}>
                  <Heart color="#FF6B6B" size={20} fill="#FF6B6B" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    backgroundColor: "#000000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow1: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "600" as const,
    textAlign: "center",
  },
  foodGrid: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    gap: 12,
  },
  foodCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative" as const,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  foodImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  foodImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  foodInfo: {
    padding: 12,
    gap: 4,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: isRTL ? "right" : "left",
  },
  foodCalories: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600" as const,
  },
  loadingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteIcon: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
