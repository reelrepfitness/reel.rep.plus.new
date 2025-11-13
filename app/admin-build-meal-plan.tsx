import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Keyboard,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { FoodBankItem, User } from "@/lib/types";
import { SearchBar } from "@/components/ui/searchbar";
import { useState, useMemo } from "react";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminBuildMealPlan');

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
  food_item?: {
    id: number;
    name: string;
    img_url: string | null;
  };
}

const MEAL_CATEGORIES = ["ארוחת בוקר", "ארוחת ביניים", "ארוחת צהריים", "ארוחת ערב"];

const categoryIcons = {
  "חלבון": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984930/steak_1_h9xrdj.webp",
  "פחמימה": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984887/bread-slice_1_cjf894.webp",
  "שומן": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984886/avocado_btlmth.webp",
  "ירק": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984897/broccoli_uf2pzr.webp",
  "פרי": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984875/apple_jsnkpt.webp",
  "ממרחים": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984926/sauce_xujuvj.webp",
  "מכולת": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758994452/grocery-basket_xutxrp.webp",
};

export default function AdminBuildMealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const queryClient = useQueryClient();
  const { isVisible, open, close } = useBottomSheet();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodBankItem | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;

      logger.info("[AdminMealPlan] Fetching user profile:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        logger.error("[AdminMealPlan] Error fetching user profile:", error);
        throw error;
      }

      logger.info("[AdminMealPlan] User profile loaded");
      return data as User;
    },
    enabled: !!userId,
  });

  const { data: mealPlanItems = [], isLoading } = useQuery({
    queryKey: ["adminMealPlan", userId],
    queryFn: async () => {
      if (!userId) return [];

      logger.info("[AdminMealPlan] Fetching meal plan for user:", userId);

      const { data, error } = await supabase
        .from("meal_plan_items")
        .select(`
          *,
          food_item:food_id (
            id,
            name,
            img_url
          )
        `)
        .eq("user_id", userId)
        .order("meal_category", { ascending: true });

      if (error) {
        logger.error("[AdminMealPlan] Error fetching meal plan:", error);
        throw error;
      }

      logger.info(`[AdminMealPlan] Loaded ${data?.length || 0} items`);
      return data as MealPlanItem[];
    },
    enabled: !!userId,
  });

  const { data: foodBankItems = [] } = useQuery({
    queryKey: ["foodBank"],
    queryFn: async () => {
      logger.info("[AdminMealPlan] Fetching food bank items");
      
      const { data, error } = await supabase
        .from("food_bank")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        logger.error("[AdminMealPlan] Error fetching food bank:", error);
        throw error;
      }

      logger.info(`[AdminMealPlan] Loaded ${data?.length || 0} food items`);
      return data as FoodBankItem[];
    },
  });

  const mainCategories = useMemo(() => {
    const categoryOrder = ["חלבון", "פחמימה", "שומן", "ירק", "פרי", "ממרחים", "מכולת"];
    const categories = new Set(foodBankItems.map(item => item.category));
    const availableCategories = Array.from(categories).filter(Boolean);
    return categoryOrder.filter(cat => availableCategories.includes(cat));
  }, [foodBankItems]);

  const filteredFoodItems = useMemo(() => {
    let filtered = foodBankItems.filter(item => item.category !== "מסעדות");

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    } else {
      if (filterCategory) {
        filtered = filtered.filter(item => item.category === filterCategory);
      }
    }

    logger.info(`[AdminMealPlan] Filtered ${filtered.length} items (category: ${filterCategory}, search: "${searchQuery}")`);
    return filtered;
  }, [foodBankItems, searchQuery, filterCategory]);

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("meal_plan_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMealPlan", userId] });
    },
    onError: (error) => {
      logger.error("[AdminMealPlan] Error deleting item:", error);
      Alert.alert("שגיאה", "אירעה שגיאה במחיקת הפריט");
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ food, mealCategory, qty }: { food: FoodBankItem; mealCategory: string; qty: number }) => {
      logger.info("[AdminMealPlan] Adding food to meal plan:", food.name, "x", qty, "to", mealCategory);

      const { error } = await supabase
        .from("meal_plan_items")
        .insert([
          {
            user_id: userId,
            food_id: food.id,
            meal_category: mealCategory,
            quantity: qty,
            kcal: food.caloreis_per_unit * qty,
            protein_units: food.protien_units * qty,
            carb_units: food.carb_units * qty,
            fat_units: food.fats_units * qty,
            veg_units: food.veg_units * qty,
            fruit_units: food.fruit_units * qty,
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMealPlan", userId] });
      setSelectedFood(null);
      setQuantity("1");
      close();
      Alert.alert("הצלחה", "המזון נוסף לתפריט בהצלחה");
    },
    onError: (error) => {
      logger.error("[AdminMealPlan] Error adding item:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהוספת הפריט");
    },
  });

  const handleAddFood = (category: string) => {
    setSelectedCategory(category);
    setFilterCategory(null);
    setSearchQuery("");
    open();
  };

  const handleFoodPress = (food: FoodBankItem) => {
    setSelectedFood(food);
  };

  const handleAddToMealPlan = () => {
    if (!selectedFood || !selectedCategory) return;
    
    const qty = parseFloat(quantity) || 1;
    addMutation.mutate({
      food: selectedFood,
      mealCategory: selectedCategory,
      qty,
    });
  };

  const handleCategoryPress = (category: string) => {
    if (filterCategory === category) {
      setFilterCategory(null);
    } else {
      setFilterCategory(category);
    }
  };

  const incrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    setQuantity((num + 1).toString());
  };

  const decrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    if (num > 1) {
      setQuantity((num - 1).toString());
    } else {
      setQuantity("1");
    }
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const handleCloseSheet = () => {
    close();
    setSelectedFood(null);
    setQuantity("1");
    setFilterCategory(null);
    setSearchQuery("");
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      "מחיקת פריט",
      "האם אתה בטוח שברצונך למחוק פריט זה?",
      [
        { text: "ביטול", style: "cancel" },
        { text: "מחק", style: "destructive", onPress: () => deleteMutation.mutate(itemId) },
      ]
    );
  };

  const calculateRMR = (gender: string | null | undefined, age: string | null | undefined, height: number | null | undefined, weight: number | null | undefined) => {
    if (!gender || !age || !height || !weight) return null;

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return null;

    let heightInCm = height;
    if (height < 50) {
      heightInCm = height * 100;
    }

    let rmr = 0;
    if (gender === "male") {
      rmr = (10 * weight) + (6.25 * heightInCm) - (5 * ageNum) + 5;
    } else if (gender === "female") {
      rmr = (10 * weight) + (6.25 * heightInCm) - (5 * ageNum) - 161;
    } else {
      return null;
    }

    return Math.round(rmr);
  };

  const renderMacroCard = (label: string, goal: number, current: number, color: string) => {
    const remaining = goal - current;
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

    return (
      <View key={label} style={[styles.macroCard, { borderColor: color }]}>
        <View style={styles.macroCardHeader}>
          <Text style={styles.macroCardLabel}>{label}</Text>
        </View>
        
        <View style={styles.macroCardContent}>
          <View style={styles.macroCardRow}>
            <Text style={styles.macroCardValue}>{Math.round(current)}</Text>
            <Text style={styles.macroCardDivider}>/</Text>
            <Text style={[styles.macroCardGoal, { color }]}>{Math.round(goal)}</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
          </View>
          
          <View style={styles.macroCardFooter}>
            <Text style={[styles.macroCardRemaining, { color: remaining > 0 ? "#10B981" : "#EF4444" }]}>
              {remaining > 0 ? "+" : ""}{Math.round(remaining)}
            </Text>
            <Text style={styles.macroCardRemainingLabel}>נותר</Text>
          </View>
        </View>
      </View>
    );
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
          <View style={styles.headerGlass} />

          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>בניית תפריט</Text>
              <Text style={styles.headerSubtitle}>{userName}</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {userProfile && calculateRMR(userProfile.gender, userProfile.age, userProfile.height, userProfile.body_weight) && (
            <View style={styles.rmrCard}>
              <View style={styles.rmrCardHeader}>
                <Text style={styles.rmrCardTitle}>RMR - קצב חילוף חומרים במנוחה</Text>
              </View>
              <View style={styles.rmrCardBody}>
                <View style={styles.rmrValueContainer}>
                  <Text style={styles.rmrValue}>
                    {calculateRMR(userProfile.gender, userProfile.age, userProfile.height, userProfile.body_weight)}
                  </Text>
                  <Text style={styles.rmrUnit}>קק"ל</Text>
                </View>
                <View style={styles.rmrDetails}>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{userProfile.body_weight} ק"ג</Text>
                    <Text style={styles.rmrDetailLabel}>משקל:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{userProfile.height} ס"מ</Text>
                    <Text style={styles.rmrDetailLabel}>גובה:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{userProfile.age}</Text>
                    <Text style={styles.rmrDetailLabel}>גיל:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{userProfile.gender === "male" ? "זכר" : "נקבה"}</Text>
                    <Text style={styles.rmrDetailLabel}>מגדר:</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rmrFooter}>
                <Text style={styles.rmrFooterText}>חישוב לפי נוסחת Mifflin-St Jeor</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionHeader}>יעדים תזונתיים</Text>

          {userProfile && (
            <View style={styles.macroCardsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.macroCardsContainer}
              >
                {renderMacroCard(
                  "חלבון",
                  userProfile.protein_units || 0,
                  mealPlanItems.reduce((sum, item) => sum + item.protein_units, 0),
                  colors.protein
                )}
                {renderMacroCard(
                  "פחמימה",
                  userProfile.carb_units || 0,
                  mealPlanItems.reduce((sum, item) => sum + item.carb_units, 0),
                  colors.carb
                )}
                {renderMacroCard(
                  "שומן",
                  userProfile.fat_units || 0,
                  mealPlanItems.reduce((sum, item) => sum + item.fat_units, 0),
                  colors.fat
                )}
                {renderMacroCard(
                  "ירק",
                  userProfile.veg_units || 0,
                  mealPlanItems.reduce((sum, item) => sum + item.veg_units, 0),
                  colors.vegetable
                )}
                {renderMacroCard(
                  "פרי",
                  userProfile.fruit_units || 0,
                  mealPlanItems.reduce((sum, item) => sum + item.fruit_units, 0),
                  colors.fruit
                )}
              </ScrollView>
            </View>
          )}

          {MEAL_CATEGORIES.map((category) => {
            const categoryItems = mealPlanItems.filter(
              (item) => item.meal_category === category
            );

            const totals = categoryItems.reduce(
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

            return (
              <View key={category} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddFood(category)}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.mealTitle}>{category}</Text>
                </View>

                {categoryItems.length > 0 ? (
                  <>
                    <View style={styles.itemsList}>
                      {categoryItems.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(item.id)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color="#FF6B6B" />
                          </TouchableOpacity>

                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>
                              {item.food_item?.name || "מזון"}
                            </Text>
                            <Text style={styles.itemDetails}>
                              כמות: {item.quantity} | {Math.round(item.kcal)} קל&apos;
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.totalsRow}>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>קלוריות</Text>
                        <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>חלבון</Text>
                        <Text style={styles.totalValue}>{totals.protein.toFixed(1)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>פחמימות</Text>
                        <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>שומן</Text>
                        <Text style={styles.totalValue}>{totals.fats.toFixed(1)}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyText}>לחץ על + להוספת מזון</Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        <BottomSheet isVisible={isVisible} onClose={handleCloseSheet} snapPoints={[0.85]}>
          <View style={styles.bottomSheetContent}>
            {!selectedFood ? (
              <>
                <View style={styles.stickyHeaderSection}>
                  <View style={styles.sheetHeader}>
                    <TouchableOpacity
                      style={styles.closeSheetButton}
                      onPress={handleCloseSheet}
                      activeOpacity={0.7}
                    >
                      <X size={24} color="#2d3748" />
                    </TouchableOpacity>
                    <Text style={styles.sheetTitle}>
                      {selectedCategory ? `הוספה ל${selectedCategory}` : "בחר מזון"}
                    </Text>
                    <View style={{ width: 40 }} />
                  </View>

                  <View style={styles.searchSection}>
                    <SearchBar
                      placeholder="חיפוש..."
                      onSearch={setSearchQuery}
                      loading={false}
                      value={searchQuery}
                    />
                  </View>

                  <View style={styles.categorySection}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryScroll}
                    >
                      {mainCategories.map((cat) => {
                        const isSelected = filterCategory === cat;
                        const icon = categoryIcons[cat as keyof typeof categoryIcons];
                        
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.categoryChip,
                              isSelected && styles.categoryChipActive,
                            ]}
                            onPress={() => handleCategoryPress(cat)}
                            activeOpacity={0.7}
                          >
                            {icon && (
                              <Image
                                source={{ uri: icon }}
                                style={styles.categoryChipIcon}
                                resizeMode="contain"
                              />
                            )}
                            <Text
                              style={[
                                styles.categoryChipText,
                                isSelected && styles.categoryChipTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                <ScrollView
                  style={styles.foodListScroll}
                  contentContainerStyle={styles.foodList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredFoodItems.length === 0 ? (
                    <View style={styles.emptyFoodList}>
                      <Text style={styles.emptyFoodText}>אין תוצאות</Text>
                    </View>
                  ) : (
                    filteredFoodItems.map((food) => (
                      <TouchableOpacity
                        key={food.id}
                        style={styles.foodItemCard}
                        onPress={() => handleFoodPress(food)}
                        activeOpacity={0.7}
                      >
                        {food.img_url ? (
                          <Image
                            source={{ uri: food.img_url }}
                            style={styles.foodItemImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.foodItemImagePlaceholder}>
                            <Text style={styles.foodItemImagePlaceholderText}>
                              אני יודע שאין תמונה.{"\n"}אני על זה.
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.foodItemDetails}>
                          <Text style={styles.foodItemName} numberOfLines={2}>
                            {food.name}
                          </Text>
                          
                          <View style={styles.foodItemMacros}>
                            {food.protien_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.protein}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(food.protien_units)}</Text>
                              </View>
                            )}
                            {food.carb_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.carb}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(food.carb_units)}</Text>
                              </View>
                            )}
                            {food.fats_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.fat}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(food.fats_units)}</Text>
                              </View>
                            )}
                            {food.veg_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.vegetable}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(food.veg_units)}</Text>
                              </View>
                            )}
                            {food.fruit_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.fruit}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(food.fruit_units)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <TouchableOpacity
                    style={styles.closeSheetButton}
                    onPress={handleCloseSheet}
                    activeOpacity={0.7}
                  >
                    <X size={24} color="#2d3748" />
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>
                    {selectedCategory ? `הוספה ל${selectedCategory}` : "בחר מזון"}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>
                
                <View style={styles.selectedFoodSection}>
                {selectedFood.img_url && (
                  <Image
                    source={{ uri: selectedFood.img_url }}
                    style={styles.selectedFoodImage}
                    resizeMode="contain"
                  />
                )}
                
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                
                <View style={styles.quantitySection}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={decrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.quantityValue}
                    value={quantity}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      if (parts.length > 2) {
                        setQuantity(parts[0] + '.' + parts.slice(1).join(''));
                      } else {
                        setQuantity(cleaned);
                      }
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                  />

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={incrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calculationPreview}>
                  <View style={styles.calcPreviewCard}>
                    <Text style={styles.calcPreviewValue}>
                      {formatUnit(selectedFood.caloreis_per_unit * (parseFloat(quantity) || 1))} קק״ל
                    </Text>
                  </View>
                  {selectedFood.protien_units > 0 && (
                    <View style={[styles.calcPreviewCard, { backgroundColor: colors.protein }]}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                        style={styles.calcPreviewIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.calcPreviewValue, { color: "#000000" }]}>
                        {formatUnit(selectedFood.protien_units * (parseFloat(quantity) || 1))}
                      </Text>
                    </View>
                  )}
                  {selectedFood.carb_units > 0 && (
                    <View style={[styles.calcPreviewCard, { backgroundColor: colors.carb }]}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                        style={styles.calcPreviewIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.calcPreviewValue, { color: "#000000" }]}>
                        {formatUnit(selectedFood.carb_units * (parseFloat(quantity) || 1))}
                      </Text>
                    </View>
                  )}
                  {selectedFood.fats_units > 0 && (
                    <View style={[styles.calcPreviewCard, { backgroundColor: colors.fat }]}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                        style={styles.calcPreviewIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.calcPreviewValue, { color: "#000000" }]}>
                        {formatUnit(selectedFood.fats_units * (parseFloat(quantity) || 1))}
                      </Text>
                    </View>
                  )}
                  {selectedFood.veg_units > 0 && (
                    <View style={[styles.calcPreviewCard, { backgroundColor: colors.vegetable }]}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp" }}
                        style={styles.calcPreviewIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.calcPreviewValue, { color: "#000000" }]}>
                        {formatUnit(selectedFood.veg_units * (parseFloat(quantity) || 1))}
                      </Text>
                    </View>
                  )}
                  {selectedFood.fruit_units > 0 && (
                    <View style={[styles.calcPreviewCard, { backgroundColor: colors.fruit }]}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp" }}
                        style={styles.calcPreviewIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.calcPreviewValue, { color: "#000000" }]}>
                        {formatUnit(selectedFood.fruit_units * (parseFloat(quantity) || 1))}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.addToMealButton}
                    onPress={handleAddToMealPlan}
                    activeOpacity={0.8}
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.addToMealButtonText}>הוסף לתפריט</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToListButton}
                    onPress={() => setSelectedFood(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backToListButtonText}>חזור לרשימה</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </>
            )}
          </View>
        </BottomSheet>
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
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
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
  },
  mealHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsList: {
    gap: 8,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: isRTL ? "right" : "left",
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    paddingVertical: 20,
  },
  totalsRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  totalItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  bottomSheetContent: {
    flex: 1,
  },
  stickyHeaderSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 10,
  },
  sheetHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  closeSheetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  categorySection: {
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
  },
  categoryChip: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipIcon: {
    width: 20,
    height: 20,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  foodListScroll: {
    flex: 1,
  },
  foodList: {
    gap: 12,
    paddingBottom: 20,
  },
  emptyFoodList: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyFoodText: {
    fontSize: 16,
    color: "#999",
  },
  foodItemCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    backgroundColor: "#F7FAFC",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  foodItemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  foodItemImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  foodItemImagePlaceholderText: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: "#999",
    textAlign: "center" as const,
    lineHeight: 13,
  },
  foodItemDetails: {
    flex: 1,
    gap: 8,
  },
  foodItemName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
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
  selectedFoodSection: {
    gap: 24,
    alignItems: "center",
    paddingTop: 16,
  },
  selectedFoodImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  selectedFoodName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  quantitySection: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  quantityButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quantityButtonText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    lineHeight: 32,
  },
  quantityValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 60,
    textAlign: "center",
  },
  calculationPreview: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  calcPreviewCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7FAFC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  calcPreviewIcon: {
    width: 24,
    height: 24,
  },
  calcPreviewValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  sheetActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 8,
  },
  addToMealButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addToMealButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  backToListButton: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  backToListButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#718096",
  },
  macroCardsWrapper: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  macroCardsContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    paddingEnd: 4,
  },
  macroCard: {
    width: 140,
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  macroCardHeader: {
    marginBottom: 12,
  },
  macroCardLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: isRTL ? "right" : "left",
  },
  macroCardContent: {
    gap: 8,
  },
  macroCardRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  macroCardValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  macroCardDivider: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.5)",
  },
  macroCardGoal: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%" as any,
    borderRadius: 3,
  },
  macroCardFooter: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 4,
  },
  macroCardRemaining: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  macroCardRemainingLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  rmrCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  rmrCardHeader: {
    marginBottom: 20,
  },
  rmrCardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FF6B35",
    textAlign: isRTL ? "right" : "left",
  },
  rmrCardBody: {
    gap: 16,
  },
  rmrValueContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  rmrValue: {
    fontSize: 48,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  rmrUnit: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.7)",
  },
  rmrDetails: {
    gap: 8,
  },
  rmrDetailRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rmrDetailLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.8)",
  },
  rmrDetailValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#FFFFFF",
  },
  rmrFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  rmrFooterText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontStyle: "italic" as const,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 16,
  },
});
