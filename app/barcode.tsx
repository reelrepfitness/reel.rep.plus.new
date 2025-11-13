import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Keyboard,
  Animated,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Scan, Plus, Minus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState, useRef } from "react";
import { useHomeData } from "@/lib/useHomeData";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Barcode');

interface BarcodeItem {
  id: number;
  barcode: string;
  name: string;
  brand_name: string | null;
  total_product_weight_g: number | null;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  calories_per_100g: number;
  protein_servings_per_100g: number | null;
  carb_servings_per_100g: number | null;
  fat_servings_per_100g: number | null;
  serving_size_g: number | null;
  img_url: string | null;
  notes: string | null;
}

export default function BarcodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog } = useHomeData();

  const mealType = params.mealType as string | undefined;

  const [selectedItem, setSelectedItem] = useState<BarcodeItem | null>(null);
  const [quantity, setQuantity] = useState<string>("100");
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { data: barcodeItems = [], isLoading } = useQuery({
    queryKey: ["barcodeItems"],
    queryFn: async () => {
      logger.info("[Barcode] Fetching barcode items");

      const { data, error } = await supabase
        .from("barcode_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        logger.error("[Barcode] Error fetching items:", error);
        throw error;
      }

      logger.info(`[Barcode] Found ${data?.length || 0} items`);
      return data as BarcodeItem[];
    },
  });

  const addToMealMutation = useMutation({
    mutationFn: async ({
      item,
      grams,
    }: {
      item: BarcodeItem;
      grams: number;
    }) => {
      if (!dailyLog?.id || !mealType) {
        throw new Error("Missing daily log or meal type");
      }

      logger.info("[Barcode] Adding to meal:", {
        item: item.name,
        grams,
        mealType,
      });

      const ratio = grams / 100;
      const calories = item.calories_per_100g * ratio;
      const proteinServings = (item.protein_servings_per_100g || 0) * ratio;
      const carbServings = (item.carb_servings_per_100g || 0) * ratio;
      const fatServings = (item.fat_servings_per_100g || 0) * ratio;

      const { error } = await supabase.from("daily_items").insert([
        {
          daily_log_id: dailyLog.id,
          food_id: item.id,
          meal_category: mealType,
          measure_type: "grams",
          quantity: 1,
          grams: grams,
          kcal: calories,
          protein_units: proteinServings,
          carb_units: carbServings,
          fat_units: fatServings,
          veg_units: 0,
          fruit_units: 0,
        },
      ]);

      if (error) {
        logger.error("[Barcode] Error inserting daily item:", error);
        throw error;
      }

      logger.info("[Barcode] Daily item inserted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
      closeBottomSheet();
      router.back();
    },
  });

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const calculateMacros = (item: BarcodeItem, grams: number) => {
    const ratio = grams / 100;
    return {
      calories: Math.round(item.calories_per_100g * ratio),
      protein: formatUnit((item.protein_servings_per_100g || 0) * ratio),
      carbs: formatUnit((item.carb_servings_per_100g || 0) * ratio),
      fats: formatUnit((item.fat_servings_per_100g || 0) * ratio),
    };
  };

  const handleItemPress = (item: BarcodeItem) => {
    setSelectedItem(item);
    setQuantity("100");
    setShowBottomSheet(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowBottomSheet(false);
      setSelectedItem(null);
      setQuantity("100");
    });
  };

  const handleIncrease = () => {
    const num = parseFloat(quantity) || 0;
    setQuantity((num + 10).toString());
  };

  const handleDecrease = () => {
    const num = parseFloat(quantity) || 0;
    if (num > 10) {
      setQuantity((num - 10).toString());
    }
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    const grams = parseFloat(quantity);
    if (grams && grams > 0) {
      addToMealMutation.mutate({ item: selectedItem, grams });
    }
  };

  const handleOpenScanner = () => {
    router.push({
      pathname: "/barcode-scanner",
      params: { mealType: mealType || "" },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow1}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={colors.white} size={24} />
            </TouchableOpacity>
            <Scan color={colors.white} size={28} />
            <View style={styles.backButton} />
          </View>
          <View style={styles.headerRow2}>
            <Text style={styles.headerTitle}>מסך ברקוד</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleOpenScanner}
              activeOpacity={0.8}
            >
              <Scan color="#FFFFFF" size={32} strokeWidth={2.5} />
              <Text style={styles.scanButtonText}>סרוק ברקוד</Text>
            </TouchableOpacity>

            {barcodeItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Scan color={colors.gray} size={64} />
                <Text style={styles.emptyText}>אין פריטים בהיסטוריה</Text>
                <Text style={styles.emptySubtext}>
                  סרוק ברקוד כדי להוסיף מוצרים למאגר
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>פריטים שנסרקו</Text>
                  <Text style={styles.sectionSubtitle}>
                    לחץ על פריט כדי להוסיף לארוחה
                  </Text>
                </View>

                {barcodeItems.map((item) => {
                  const macros = calculateMacros(item, 100);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemCard}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemHeader}>
                        {item.img_url && (
                          <Image
                            source={{ uri: item.img_url }}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          {item.brand_name && (
                            <Text style={styles.itemBrand}>{item.brand_name}</Text>
                          )}
                          <Text style={styles.itemPer100}>לכל 100 גרם</Text>
                        </View>
                      </View>

                      <View style={styles.macrosRow}>
                        <View style={styles.macroCard}>
                          <Image
                            source={{
                              uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
                            }}
                            style={styles.macroIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.macroValue}>{macros.calories}</Text>
                          <Text style={styles.macroLabel}>קל׳</Text>
                        </View>

                        {parseFloat(macros.protein) > 0 && (
                          <View style={styles.macroCard}>
                            <Image
                              source={{
                                uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp",
                              }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{macros.protein}</Text>
                          </View>
                        )}

                        {parseFloat(macros.carbs) > 0 && (
                          <View style={styles.macroCard}>
                            <Image
                              source={{
                                uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp",
                              }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{macros.carbs}</Text>
                          </View>
                        )}

                        {parseFloat(macros.fats) > 0 && (
                          <View style={styles.macroCard}>
                            <Image
                              source={{
                                uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp",
                              }}
                              style={styles.macroIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.macroValue}>{macros.fats}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        )}

        {showBottomSheet && selectedItem && (
          <BottomSheet isVisible={showBottomSheet} onClose={closeBottomSheet}>
            <View style={styles.sheetContent}>
              {selectedItem.img_url && (
                <Image
                  source={{ uri: selectedItem.img_url }}
                  style={styles.sheetImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.sheetTitle}>{selectedItem.name}</Text>
              {selectedItem.brand_name && (
                <Text style={styles.sheetBrand}>{selectedItem.brand_name}</Text>
              )}

              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>כמות (גרם)</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={handleIncrease}
                    activeOpacity={0.7}
                  >
                    <Plus color="#FFFFFF" size={20} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, "");
                      setQuantity(cleaned);
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                  />

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={handleDecrease}
                    activeOpacity={0.7}
                  >
                    <Minus color="#FFFFFF" size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sheetMacrosRow}>
                {(() => {
                  const grams = parseFloat(quantity) || 100;
                  const macros = calculateMacros(selectedItem, grams);
                  return (
                    <>
                      <View style={styles.sheetMacroCard}>
                        <Image
                          source={{
                            uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
                          }}
                          style={styles.sheetMacroIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.sheetMacroValue}>
                          {macros.calories} קל׳
                        </Text>
                      </View>

                      {parseFloat(macros.protein) > 0 && (
                        <View style={styles.sheetMacroCard}>
                          <Image
                            source={{
                              uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp",
                            }}
                            style={styles.sheetMacroIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.sheetMacroValue}>{macros.protein}</Text>
                        </View>
                      )}

                      {parseFloat(macros.carbs) > 0 && (
                        <View style={styles.sheetMacroCard}>
                          <Image
                            source={{
                              uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp",
                            }}
                            style={styles.sheetMacroIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.sheetMacroValue}>{macros.carbs}</Text>
                        </View>
                      )}

                      {parseFloat(macros.fats) > 0 && (
                        <View style={styles.sheetMacroCard}>
                          <Image
                            source={{
                              uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp",
                            }}
                            style={styles.sheetMacroIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.sheetMacroValue}>{macros.fats}</Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    addToMealMutation.isPending && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={addToMealMutation.isPending}
                  activeOpacity={0.8}
                >
                  {addToMealMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>הוסף לארוחה</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeBottomSheet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
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
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center",
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
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.gray,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
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
    marginBottom: 12,
    gap: 12,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  itemBrand: {
    fontSize: 14,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
  },
  itemPer100: {
    fontSize: 12,
    color: "#A0AEC0",
    textAlign: isRTL ? "right" : "left",
  },
  macrosRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    gap: 8,
    flexWrap: "wrap",
  },
  macroCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  macroIcon: {
    width: 18,
    height: 18,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#718096",
  },
  sheetContent: {
    gap: 20,
    paddingBottom: 20,
  },
  sheetImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  sheetBrand: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginTop: -12,
  },
  quantitySection: {
    gap: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  quantityControls: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quantityInput: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 80,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  sheetMacrosRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  sheetMacroCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7FAFC",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  sheetMacroIcon: {
    width: 24,
    height: 24,
  },
  sheetMacroValue: {
    fontSize: 18,
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
  confirmButtonDisabled: {
    opacity: 0.6,
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
});
