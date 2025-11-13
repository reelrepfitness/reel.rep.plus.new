import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Keyboard,
  Image,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RestaurantMenuItem } from "@/lib/types";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { useHomeData } from "@/lib/useHomeData";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('RestaurantMenu');

const foodIcons: Record<string, string> = {
  hamburger: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984906/hamburger_rdbysh.webp",
  pizza: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984906/hamburger_rdbysh.webp",
  salad: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984897/broccoli_uf2pzr.webp",
  pasta: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984887/bread-slice_1_cjf894.webp",
  steak: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984930/steak_1_h9xrdj.webp",
  chicken: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984930/steak_1_h9xrdj.webp",
  fish: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984930/steak_1_h9xrdj.webp",
  sandwich: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984887/bread-slice_1_cjf894.webp",
  soup: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984897/broccoli_uf2pzr.webp",
  dessert: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984875/apple_jsnkpt.webp",
  drink: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
  default: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
};

const getFoodIcon = (iconName: string | null): string => {
  if (!iconName) return foodIcons.default;
  return foodIcons[iconName.toLowerCase()] || foodIcons.default;
};

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog } = useHomeData();

  const restaurantId = params.restaurantId as string;
  const restaurantName = params.restaurantName as string;
  const mealType = params.mealType as string | undefined;

  const [selectedItem, setSelectedItem] = useState<RestaurantMenuItem | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [sheetAnimation] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successItem, setSuccessItem] = useState<RestaurantMenuItem | null>(null);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["restaurantMenu", restaurantId],
    queryFn: async () => {
      logger.info("[RestaurantMenu] Fetching menu items for restaurant:", restaurantId);
      
      const { data, error } = await supabase
        .from("restaurant_menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name", { ascending: true });

      if (error) {
        logger.error("[RestaurantMenu] Error fetching:", error);
        throw error;
      }

      logger.info(`[RestaurantMenu] Loaded ${data?.length || 0} menu items`);
      return data as RestaurantMenuItem[];
    },
  });

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const handleItemPress = (item: RestaurantMenuItem) => {
    logger.info("[RestaurantMenu] Selected item:", item.name);
    setSelectedItem(item);
    setQuantity("0.5");
    Animated.spring(sheetAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  };

  const incrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    setQuantity((num + 0.5).toFixed(1));
  };

  const decrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    if (num > 0.5) {
      setQuantity((num - 0.5).toFixed(1));
    } else {
      setQuantity("0.5");
    }
  };

  const closeSheet = () => {
    Animated.timing(sheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedItem(null);
      setQuantity("0.5");
    });
  };

  const handleConfirm = async () => {
    if (!selectedItem || !dailyLog?.id || !mealType) return;

    try {
      logger.info("[RestaurantMenu] Adding item:", selectedItem.name, "x", quantity, "to", mealType);

      const quantityNum = parseFloat(quantity) || 0.5;
      const totalCalories = selectedItem.calories_per_unit * quantityNum;
      const proteinUnits = selectedItem.protein_units * quantityNum;
      const carbUnits = selectedItem.carb_units * quantityNum;
      const fatUnits = selectedItem.fat_units * quantityNum;

      const { error: itemError } = await supabase
        .from("daily_items")
        .insert([{
          daily_log_id: dailyLog.id,
          food_id: selectedItem.id,
          meal_category: mealType,
          measure_type: "unit",
          quantity: quantityNum,
          grams: 0,
          kcal: totalCalories,
          protein_units: proteinUnits,
          carb_units: carbUnits,
          fat_units: fatUnits,
          veg_units: 0,
          fruit_units: 0,
        }]);

      if (itemError) {
        logger.error("[RestaurantMenu] Error inserting daily item:", itemError);
        throw itemError;
      }

      logger.info("[RestaurantMenu] Daily item inserted successfully");

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      setSuccessItem(selectedItem);
      setShowSuccess(true);
      closeSheet();
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity("0.5");
      }, 2000);
    } catch (error) {
      logger.error("[RestaurantMenu] Failed to add item:", error);
    }
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

          <Text style={styles.headerTitle}>{restaurantName}</Text>
          <View style={styles.spacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : menuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>אין פריטים בתפריט</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuGrid}>
              {menuItems.map((item) => {
                const hasProtein = item.protein_units > 0;
                const hasCarbs = item.carb_units > 0;
                const hasFat = item.fat_units > 0;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuCard}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.menuCardHeader}>
                      <Image
                        source={{ uri: getFoodIcon(item.icon_name) }}
                        style={styles.menuIcon}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.menuCardContent}>
                      <Text style={styles.menuItemName} numberOfLines={2}>
                        {item.name}
                      </Text>

                      <View style={styles.macrosRow}>
                        {hasProtein && (
                          <View style={[styles.macroCard, { backgroundColor: `${colors.protein}30` }]}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{formatUnit(item.protein_units)}</Text>
                          </View>
                        )}
                        {hasCarbs && (
                          <View style={[styles.macroCard, { backgroundColor: `${colors.carb}30` }]}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{formatUnit(item.carb_units)}</Text>
                          </View>
                        )}
                        {hasFat && (
                          <View style={[styles.macroCard, { backgroundColor: `${colors.fat}30` }]}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{formatUnit(item.fat_units)}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.caloriesText}>{item.calories_per_unit} קל׳</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {showSuccess && successItem && (
          <View style={styles.successNotification}>
            <View style={styles.successContent}>
              <Text style={styles.successText}>✓</Text>
              <Text style={styles.successMessage}>
                {parseFloat(quantity) || 0.5} {successItem.name} נוסף ליומן בהצלחה
              </Text>
            </View>
          </View>
        )}

        {selectedItem && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeSheet}
          >
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{
                    translateY: sheetAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [500, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.sheetHandle} />
              
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.sheetContent}
              >
                <View style={styles.sheetIconContainer}>
                  <Image
                    source={{ uri: getFoodIcon(selectedItem.icon_name) }}
                    style={styles.sheetIcon}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.sheetTitle}>{selectedItem.name}</Text>

                <Text style={styles.sheetSubtitle}>כמה אכלת? (בחלקים של 0.5)</Text>

                <View style={styles.counterSection}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={decrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.counterValue}
                    value={quantity}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      setQuantity(cleaned);
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                  />

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={incrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calculationSection}>
                  <View style={styles.calcCard}>
                    <Image
                      source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp" }}
                      style={styles.calcIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.calcValue}>
                      {formatUnit(selectedItem.calories_per_unit * (parseFloat(quantity) || 0.5))} קל׳
                    </Text>
                  </View>
                  {selectedItem.protein_units > 0 && (
                    <View style={styles.calcCard}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                        style={styles.calcIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.calcValue}>
                        {formatUnit(selectedItem.protein_units * (parseFloat(quantity) || 0.5))}
                      </Text>
                    </View>
                  )}
                  {selectedItem.carb_units > 0 && (
                    <View style={styles.calcCard}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                        style={styles.calcIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.calcValue}>
                        {formatUnit(selectedItem.carb_units * (parseFloat(quantity) || 0.5))}
                      </Text>
                    </View>
                  )}
                  {selectedItem.fat_units > 0 && (
                    <View style={styles.calcCard}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                        style={styles.calcIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.calcValue}>
                        {formatUnit(selectedItem.fat_units * (parseFloat(quantity) || 0.5))}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>אישור</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeSheet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
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
  menuGrid: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    flexWrap: "wrap",
    gap: 12,
  },
  menuCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuCardHeader: {
    backgroundColor: "#F7FAFC",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  menuIcon: {
    width: 64,
    height: 64,
  },
  menuCardContent: {
    padding: 12,
    gap: 8,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    minHeight: 36,
  },
  macrosRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    gap: 4,
    flexWrap: "wrap",
  },
  macroCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroIcon: {
    width: 12,
    height: 12,
  },
  macroValue: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  caloriesText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.primary,
    textAlign: isRTL ? "right" : "left",
  },
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 10000,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    paddingHorizontal: 24,
    gap: 20,
    paddingBottom: 40,
  },
  sheetIconContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  sheetIcon: {
    width: 80,
    height: 80,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#718096",
    textAlign: "center",
  },
  counterSection: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  counterButton: {
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
  counterButtonText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    lineHeight: 32,
  },
  counterValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 80,
    textAlign: "center",
  },
  calculationSection: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  calcCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7FAFC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  calcIcon: {
    width: 28,
    height: 28,
  },
  calcValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  sheetActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
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
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#718096",
  },
  successNotification: {
    position: "absolute" as const,
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  successContent: {
    backgroundColor: "#48BB78",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  successText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    flex: 1,
    textAlign: isRTL ? "right" : "left",
  },
});
