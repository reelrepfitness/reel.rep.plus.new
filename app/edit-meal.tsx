import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Image,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Trash2, Plus, Minus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useHomeData } from "@/lib/useHomeData";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('EditMeal');

interface DailyItem {
  id: string;
  food_id: number;
  quantity: number;
  kcal: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  measure_type: string;
  food_name?: string;
  food_image?: string;
}

export default function EditMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog } = useHomeData();

  const mealType = params.mealType as string;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>("");
  const [modifiedItems, setModifiedItems] = useState<Record<string, number>>({});

  logger.info("[EditMeal] Meal type:", mealType);

  const { data: mealItems = [], isLoading } = useQuery({
    queryKey: ["mealItems", dailyLog?.id, mealType],
    queryFn: async () => {
      if (!dailyLog?.id || !mealType) {
        logger.info("[EditMeal] Missing dailyLog or mealType");
        return [];
      }

      logger.info("[EditMeal] Fetching items for meal:", mealType, "daily log:", dailyLog.id);

      const { data, error } = await supabase
        .from("daily_items")
        .select(`
          id,
          food_id,
          quantity,
          kcal,
          protein_units,
          carb_units,
          fat_units,
          veg_units,
          fruit_units,
          measure_type
        `)
        .eq("daily_log_id", dailyLog.id)
        .eq("meal_category", mealType)
        .order("created_at", { ascending: true });

      if (error) {
        logger.error("[EditMeal] Error fetching items:", error);
        throw error;
      }

      logger.info(`[EditMeal] Found ${data?.length || 0} items`);

      // Fetch food names and images
      const itemsWithNames = await Promise.all(
        (data || []).map(async (item) => {
          logger.info(`[EditMeal] Fetching food data for item ${item.id}, food_id: ${item.food_id}`);
          
          // Try food_bank first
          const { data: foodData, error: foodError } = await supabase
            .from("food_bank")
            .select("name, img_url")
            .eq("id", item.food_id)
            .maybeSingle();

          if (foodData) {
            logger.info(`[EditMeal] Found in food_bank:`, foodData.name);
            return {
              ...item,
              food_name: foodData.name,
              food_image: foodData.img_url,
            } as DailyItem;
          }

          // If not in food_bank, try restaurant_menu_items
          const { data: restaurantData, error: restaurantError } = await supabase
            .from("restaurant_menu_items")
            .select("name, image_url")
            .eq("id", item.food_id)
            .maybeSingle();

          if (restaurantData) {
            logger.info(`[EditMeal] Found in restaurant_menu_items:`, restaurantData.name);
            return {
              ...item,
              food_name: restaurantData.name,
              food_image: restaurantData.image_url,
            } as DailyItem;
          }

          logger.warn(`[EditMeal] Food not found in any table for id ${item.food_id}`);
          return {
            ...item,
            food_name: "מוצר לא ידוע",
            food_image: undefined,
          } as DailyItem;
        })
      );

      logger.info(`[EditMeal] Processed ${itemsWithNames.length} items with names`);
      return itemsWithNames;
    },
    enabled: !!dailyLog?.id && !!mealType,
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      logger.info("[EditMeal] Deleting item:", itemId);
      const { error } = await supabase
        .from("daily_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      logger.info("[EditMeal] Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["mealItems"] });
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, newQuantity }: { itemId: string; newQuantity: number }) => {
      logger.info("[EditMeal] Updating item:", itemId, "new quantity:", newQuantity);
      
      // Get the item to calculate new values
      const item = mealItems.find(i => i.id === itemId);
      if (!item) throw new Error("Item not found");

      const ratio = newQuantity / item.quantity;
      
      const { error } = await supabase
        .from("daily_items")
        .update({
          quantity: newQuantity,
          kcal: item.kcal * ratio,
          protein_units: item.protein_units * ratio,
          carb_units: item.carb_units * ratio,
          fat_units: item.fat_units * ratio,
          veg_units: item.veg_units * ratio,
          fruit_units: item.fruit_units * ratio,
        })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      logger.info("[EditMeal] Item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["mealItems"] });
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
      setEditingId(null);
      setEditingQuantity("");
    },
  });

  const handleDelete = (itemId: string) => {
    deleteMutation.mutate(itemId);
  };

  const handleIncrease = (item: DailyItem) => {
    const newQuantity = (modifiedItems[item.id] ?? item.quantity) + 1;
    setModifiedItems(prev => ({ ...prev, [item.id]: newQuantity }));
  };

  const handleDecrease = (item: DailyItem) => {
    const currentQuantity = modifiedItems[item.id] ?? item.quantity;
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      setModifiedItems(prev => ({ ...prev, [item.id]: newQuantity }));
    }
  };

  const handleQuantitySubmit = (itemId: string) => {
    const quantity = parseFloat(editingQuantity);
    if (quantity && quantity > 0) {
      setModifiedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
    setEditingId(null);
    setEditingQuantity("");
    Keyboard.dismiss();
  };

  const handleConfirmChange = (item: DailyItem) => {
    const newQuantity = modifiedItems[item.id];
    if (newQuantity !== undefined) {
      updateMutation.mutate({ itemId: item.id, newQuantity });
      setModifiedItems(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    }
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>עריכת {mealType}</Text>
          <View style={styles.spacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : mealItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>אין פריטים בארוחה זו</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {mealItems.map((item) => {
              const hasChanges = modifiedItems[item.id] !== undefined;
              const displayQuantity = modifiedItems[item.id] ?? item.quantity;
              
              return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 color="#FF3B30" size={20} />
                  </TouchableOpacity>

                  <View style={styles.itemHeaderRight}>
                    {item.food_image && (
                      <Image
                        source={{ uri: item.food_image }}
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.itemName}>{item.food_name}</Text>
                  </View>
                </View>

                <View style={styles.itemContent}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleIncrease(item)}
                      activeOpacity={0.7}
                    >
                      <Plus color="#FFFFFF" size={16} />
                    </TouchableOpacity>

                    {editingId === item.id ? (
                      <TextInput
                        style={styles.quantityInput}
                        value={editingQuantity}
                        onChangeText={setEditingQuantity}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                        returnKeyType="done"
                        onSubmitEditing={() => handleQuantitySubmit(item.id)}
                        onBlur={() => {
                          if (editingQuantity) {
                            handleQuantitySubmit(item.id);
                          } else {
                            setEditingId(null);
                          }
                        }}
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(item.id);
                          setEditingQuantity(displayQuantity.toString());
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quantityText, hasChanges && styles.quantityTextModified]}>
                          {formatUnit(displayQuantity)}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleDecrease(item)}
                      activeOpacity={0.7}
                    >
                      <Minus color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.nutritionInfo}>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionValue}>{formatUnit(item.kcal)}</Text>
                      <Text style={styles.calorieText}>קק״ל</Text>
                    </View>

                    {item.protein_units > 0 && (
                      <View style={[styles.nutritionRow, styles.proteinCard]}>
                        <Text style={styles.nutritionValue}>{formatUnit(item.protein_units)}</Text>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                          style={styles.nutritionIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {item.carb_units > 0 && (
                      <View style={[styles.nutritionRow, styles.carbCard]}>
                        <Text style={styles.nutritionValue}>{formatUnit(item.carb_units)}</Text>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                          style={styles.nutritionIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {item.fat_units > 0 && (
                      <View style={[styles.nutritionRow, styles.fatCard]}>
                        <Text style={styles.nutritionValue}>{formatUnit(item.fat_units)}</Text>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                          style={styles.nutritionIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {item.veg_units > 0 && (
                      <View style={[styles.nutritionRow, styles.vegCard]}>
                        <Text style={styles.nutritionValue}>{formatUnit(item.veg_units)}</Text>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp" }}
                          style={styles.nutritionIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {item.fruit_units > 0 && (
                      <View style={[styles.nutritionRow, styles.fruitCard]}>
                        <Text style={styles.nutritionValue}>{formatUnit(item.fruit_units)}</Text>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp" }}
                          style={styles.nutritionIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </View>
                  
                  {hasChanges && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => handleConfirmChange(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.confirmButtonText}>אישור שינויים</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )})}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F5",
  },
  header: {
    backgroundColor: "#000000",
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    flex: 1,
    textAlign: isRTL ? "right" : "left",
    marginEnd: 12,
  },
  deleteButton: {
    padding: 8,
  },
  itemContent: {
    gap: 12,
  },
  quantityControls: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 60,
    textAlign: "center",
  },
  quantityInput: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 60,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  nutritionInfo: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  nutritionRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nutritionIcon: {
    width: 20,
    height: 20,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  itemHeaderRight: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#F7FAFC",
  },
  quantityTextModified: {
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  calorieText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  proteinCard: {
    backgroundColor: "#FF6B6B",
  },
  carbCard: {
    backgroundColor: "#FFE66D",
  },
  fatCard: {
    backgroundColor: "#4ECDC4",
  },
  vegCard: {
    backgroundColor: "#95E1D3",
  },
  fruitCard: {
    backgroundColor: "#FFA07A",
  },
});
