import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  TextInput,
  Keyboard,
  Image,
  ScrollView,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { FoodBankItem } from "@/lib/types";
import { useHomeData } from "@/lib/useHomeData";
import { useQueryClient } from "@tanstack/react-query";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('BarcodeScanner');

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog, profile } = useHomeData();
  
  const mealType = params.mealType as string | undefined;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<FoodBankItem | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [showSheet, setShowSheet] = useState<boolean>(false);
  const [sheetAnimation] = useState(new Animated.Value(0));
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [previousProducts, setPreviousProducts] = useState<FoodBankItem[]>([]);
  
  const [showAddProductSheet, setShowAddProductSheet] = useState<boolean>(false);
  const [addSheetAnimation] = useState(new Animated.Value(0));
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductBrand, setNewProductBrand] = useState<string>("");
  const [newProductWeight, setNewProductWeight] = useState<string>("");
  const [newProductServingSize, setNewProductServingSize] = useState<string>("");
  const [newProductCalories, setNewProductCalories] = useState<string>("");
  const [newProductProtein, setNewProductProtein] = useState<string>("");
  const [newProductCarbs, setNewProductCarbs] = useState<string>("");
  const [newProductFat, setNewProductFat] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const loadPreviousProducts = useCallback(async () => {
    try {
      logger.info("[Barcode] Loading previous scanned products");
      
      const { data, error } = await supabase
        .from("daily_items")
        .select(`
          food_id,
          food_item:food_bank!daily_items_food_id_fkey(*)
        `)
        .eq("daily_log_id", dailyLog?.id || "")
        .not("food_item.barcode", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("[Barcode] Error loading previous products:", error.message);
        return;
      }

      const uniqueProducts = new Map<number, FoodBankItem>();
      data?.forEach((item: any) => {
        if (item.food_item && item.food_item.barcode) {
          uniqueProducts.set(item.food_id, item.food_item);
        }
      });

      const products = Array.from(uniqueProducts.values());
      logger.info(`[Barcode] Loaded ${products.length} unique scanned products`);
      setPreviousProducts(products);
    } catch (error) {
      logger.error("[Barcode] Error:", error instanceof Error ? error.message : String(error));
    }
  }, [dailyLog?.id]);

  useEffect(() => {
    if (profile?.id && dailyLog?.id) {
      loadPreviousProducts();
    }
  }, [profile?.id, dailyLog?.id, loadPreviousProducts]);

  const handleBarcodeScanned = async (data: { type: string; data: string }) => {
    if (isSearching || scannedItem || hasScanned) return;
    
    setHasScanned(true);
    setIsSearching(true);
    logger.info("[Barcode] Scanned:", data.data);
    
    try {
      const { data: item, error } = await supabase
        .from("food_bank")
        .select("*")
        .eq("barcode", data.data)
        .single();
      
      if (error || !item) {
        logger.error("[Barcode] Item not found:", error ? error.message : "No item");
        setIsSearching(false);
        setScannedBarcode(data.data);
        setShowAddProductSheet(true);
        Animated.spring(addSheetAnimation, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }).start();
        return;
      }
      
      logger.info("[Barcode] Found item:", item.name);
      setScannedItem(item as FoodBankItem);
      setQuantity("1");
      setShowSheet(true);
      setIsSearching(false);
      Animated.spring(sheetAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } catch (error) {
      logger.error("[Barcode] Error:", error instanceof Error ? error.message : String(error));
      setIsSearching(false);
      setTimeout(() => {
        setHasScanned(false);
        alert("שגיאה בחיפוש הפריט");
      }, 100);
    }
  };

  const closeSheet = () => {
    Animated.timing(sheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSheet(false);
      setScannedItem(null);
      setQuantity("1");
      setTimeout(() => setHasScanned(false), 500);
    });
  };

  const closeAddProductSheet = () => {
    Animated.timing(addSheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAddProductSheet(false);
      setScannedBarcode("");
      setNewProductName("");
      setNewProductBrand("");
      setNewProductWeight("");
      setNewProductServingSize("");
      setNewProductCalories("");
      setNewProductProtein("");
      setNewProductCarbs("");
      setNewProductFat("");
      setTimeout(() => setHasScanned(false), 500);
    });
  };

  const incrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    setQuantity((num + 0.5).toString());
  };

  const decrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    if (num > 0.5) {
      setQuantity((num - 0.5).toString());
    } else {
      setQuantity("0.5");
    }
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const handleAddProduct = async () => {
    if (!scannedBarcode || !newProductName || !newProductCalories || !newProductProtein || !newProductCarbs || !newProductFat) {
      alert("יש למלא את כל השדות החובה");
      return;
    }

    try {
      setIsSubmitting(true);
      logger.info("[Barcode] Adding new product to database");

      const { error } = await supabase
        .from("barcode_items")
        .insert([{
          barcode: scannedBarcode,
          name: newProductName,
          brand_name: newProductBrand || null,
          total_product_weight_g: newProductWeight ? parseFloat(newProductWeight) : null,
          serving_size_g: newProductServingSize ? parseFloat(newProductServingSize) : null,
          calories_per_100g: parseFloat(newProductCalories),
          protein_per_100g: parseFloat(newProductProtein),
          carbs_per_100g: parseFloat(newProductCarbs),
          fat_per_100g: parseFloat(newProductFat),
        }]);

      if (error) {
        logger.error("[Barcode] Error inserting product:", error);
        throw error;
      }

      logger.info("[Barcode] Product added successfully");
      alert("המוצר נוסף בהצלחה! תודה שעזרת לשאר המשתמשים 🎉");
      closeAddProductSheet();
    } catch (error) {
      logger.error("[Barcode] Failed to add product:", error instanceof Error ? error.message : String(error));
      alert("שגיאה בהוספת המוצר");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!scannedItem || !dailyLog?.id || !mealType) return;

    try {
      logger.info("[Barcode] Adding food:", scannedItem.name, "x", quantity, "to", mealType);

      const quantityNum = parseFloat(quantity) || 1;
      const caloriesPerUnit = scannedItem.caloreis_per_unit;
      const proteinUnits = scannedItem.protien_units * quantityNum;
      const carbUnits = scannedItem.carb_units * quantityNum;
      const fatUnits = scannedItem.fats_units * quantityNum;
      const vegUnits = scannedItem.veg_units * quantityNum;
      const fruitUnits = scannedItem.fruit_units * quantityNum;
      const totalCalories = caloriesPerUnit * quantityNum;

      const { error: itemError } = await supabase
        .from("daily_items")
        .insert([{
          daily_log_id: dailyLog.id,
          food_id: scannedItem.id,
          meal_category: mealType,
          measure_type: "unit",
          quantity: quantityNum,
          grams: 0,
          kcal: totalCalories,
          protein_units: proteinUnits,
          carb_units: carbUnits,
          fat_units: fatUnits,
          veg_units: vegUnits,
          fruit_units: fruitUnits,
        }]);

      if (itemError) {
        logger.error("[Barcode] Error inserting daily item:", itemError);
        throw itemError;
      }

      logger.info("[Barcode] Daily item inserted successfully");

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      loadPreviousProducts();
      
      closeSheet();
      router.back();
    } catch (error) {
      logger.error("[Barcode] Failed to add food:", error instanceof Error ? error.message : String(error));
      alert("שגיאה בהוספת הפריט");
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>סורק ברקוד</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>נדרשת הרשאת מצלמה לסריקת ברקוד</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>אפשר גישה למצלמה</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {Platform.OS !== 'web' && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
            ],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      {Platform.OS === 'web' && (
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackText}>סריקת ברקוד לא זמינה בגרסת הווב</Text>
        </View>
      )}
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>סורק ברקוד</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scanArea}>
        <View style={styles.scanFrame}>
          <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
          <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
          <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
          <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
        </View>
        <Text style={styles.scanText}>מרכז את הברקוד במסגרת</Text>
      </View>

      {previousProducts.length > 0 && (
        <View style={styles.previousProductsContainer}>
          <View style={styles.previousProductsHeader}>
            <Text style={styles.previousProductsTitle}>מוצרים שסרקת לאחרונה</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previousProductsList}
          >
            {previousProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.previousProductCard}
                onPress={() => {
                  setScannedItem(product);
                  setQuantity("1");
                  setShowSheet(true);
                  Animated.spring(sheetAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 90,
                  }).start();
                }}
                activeOpacity={0.8}
              >
                {product.img_url && (
                  <Image
                    source={{ uri: product.img_url }}
                    style={styles.previousProductImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.previousProductInfo}>
                  <Text style={styles.previousProductName} numberOfLines={2}>
                    {product.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isSearching && (
        <View style={styles.searchingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.searchingText}>מחפש...</Text>
        </View>
      )}

      {showSheet && scannedItem && (
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
            
            <View style={styles.sheetContent}>
              {scannedItem.img_url && (
                <Image
                  source={{ uri: scannedItem.img_url }}
                  style={styles.sheetFoodImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.sheetTitle}>{scannedItem.name}</Text>
              
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
                  style={styles.counterButton}
                  onPress={incrementQuantity}
                  activeOpacity={0.7}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.macrosContainer}>
                <View style={styles.macroCard}>
                  <Image
                    source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp" }}
                    style={styles.macroIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.macroValue}>
                    {formatUnit(scannedItem.caloreis_per_unit * (parseFloat(quantity) || 1))} קל׳
                  </Text>
                </View>
                {scannedItem.protien_units > 0 && (
                  <View style={styles.macroCard}>
                    <Image
                      source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                      style={styles.macroIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.macroValue}>
                      {formatUnit(scannedItem.protien_units * (parseFloat(quantity) || 1))}
                    </Text>
                  </View>
                )}
                {scannedItem.carb_units > 0 && (
                  <View style={styles.macroCard}>
                    <Image
                      source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                      style={styles.macroIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.macroValue}>
                      {formatUnit(scannedItem.carb_units * (parseFloat(quantity) || 1))}
                    </Text>
                  </View>
                )}
                {scannedItem.fats_units > 0 && (
                  <View style={styles.macroCard}>
                    <Image
                      source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                      style={styles.macroIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.macroValue}>
                      {formatUnit(scannedItem.fats_units * (parseFloat(quantity) || 1))}
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
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {showAddProductSheet && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeAddProductSheet}
        >
          <Animated.View
            style={[
              styles.addProductSheet,
              {
                transform: [{
                  translateY: addSheetAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.sheetHandle} />
              
              <ScrollView 
                style={styles.addProductScroll}
                contentContainerStyle={styles.addProductContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.addProductTitle}>המוצר לא נמצא במאגר</Text>
                <Text style={styles.addProductSubtitle}>עזור למשתמשים אחרים והוסף אותו!</Text>
                
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>שם המוצר *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductName}
                    onChangeText={setNewProductName}
                    placeholder="לדוגמה: יוגורט יווני"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>שם המותג (אופציונלי)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductBrand}
                    onChangeText={setNewProductBrand}
                    placeholder="לדוגמה: תנובה"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>משקל המוצר באריזה (גרם) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductWeight}
                    onChangeText={setNewProductWeight}
                    placeholder="לדוגמה: 500"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>גודל מנה (גרם, אופציונלי)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductServingSize}
                    onChangeText={setNewProductServingSize}
                    placeholder="לדוגמה: 150"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.nutritionHeader}>
                  <Text style={styles.nutritionTitle}>ערכים תזונתיים ל-100 גרם</Text>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>קלוריות *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductCalories}
                    onChangeText={setNewProductCalories}
                    placeholder="לדוגמה: 150"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>חלבון (גרם) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductProtein}
                    onChangeText={setNewProductProtein}
                    placeholder="לדוגמה: 10"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>פחמימות (גרם) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductCarbs}
                    onChangeText={setNewProductCarbs}
                    placeholder="לדוגמה: 20"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>שומן (גרם) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProductFat}
                    onChangeText={setNewProductFat}
                    placeholder="לדוגמה: 5"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.addProductActions}>
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleAddProduct}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>הוסף למאגר</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelAddButton}
                    onPress={closeAddProductSheet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelAddButtonText}>ביטול</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  webFallbackText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  header: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
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
  scanArea: {
    position: "absolute" as const,
    top: "35%",
    left: "10%",
    right: "10%",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 150,
    position: "relative" as const,
  },
  scanCorner: {
    position: "absolute" as const,
    width: 40,
    height: 40,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanText: {
    marginTop: 20,
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  searchingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    zIndex: 5,
  },
  searchingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 20,
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
    marginBottom: 20,
  },
  sheetContent: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 40,
  },
  sheetFoodImage: {
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
  counterSection: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
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
    minWidth: 60,
    textAlign: "center",
  },
  macrosContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  macroCard: {
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
  macroIcon: {
    width: 28,
    height: 28,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  sheetActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
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
  previousProductsContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  previousProductsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  previousProductsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
  },
  previousProductsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  previousProductCard: {
    width: 120,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  previousProductImage: {
    width: "100%",
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  previousProductInfo: {
    padding: 8,
  },
  previousProductName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: isRTL ? "right" : "left",
  },
  addProductSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  addProductScroll: {
    maxHeight: "100%",
  },
  addProductContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  addProductTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 8,
  },
  addProductSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#2d3748",
    marginBottom: 8,
    textAlign: isRTL ? "right" : "left",
  },
  formInput: {
    backgroundColor: "#F7FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  nutritionHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  addProductActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cancelAddButton: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelAddButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#718096",
  },
});
