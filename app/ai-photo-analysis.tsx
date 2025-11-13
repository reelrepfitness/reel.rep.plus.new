import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Camera, Image as ImageIcon, RefreshCw, Utensils, Lightbulb, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { colors } from "@/constants/colors";
import { useHomeData } from "@/lib/useHomeData";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AiPhotoAnalysis');

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface APIFoodItem {
  name: string;
  grams: number;
  calories: number;
  protein_grams: number;
  carb_grams: number;
  fat_grams: number;
  protein_portions: number;
  carb_portions: number;
  fat_portions: number;
  veg_portions: number;
  fruit_portions: number;
  category: string;
  category_image_url: string;
  food_image_url: string;
  found_in_db: boolean;
}

export default function AIPhotoAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog, goals } = useHomeData();
  
  const mealType = params.mealType as string | undefined;
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const [plateDescription, setPlateDescription] = useState<string>("");

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("נדרשת הרשאת מצלמה");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("נדרשת הרשאת גלריה");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    
    try {
      logger.info("[AI] Analyzing image...");
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(blob);
      });

      logger.info("[AI] Sending image to API...");
      const apiResponse = await fetch("https://reelrep-ai-food.ivan-5c4.workers.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: base64,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error("API request failed");
      }

      const data = await apiResponse.json();
      logger.info("[AI] Received API response:", data);

      if (data.description) {
        setPlateDescription(data.description);
      }

      const items: FoodItem[] = [];
      for (let i = 0; i < 6; i++) {
        const item: APIFoodItem | null = data[`item${i}`];
        if (item) {
          items.push({
            name: item.name,
            quantity: `${Math.round(item.grams)} גרם`,
            calories: Math.round(item.calories),
            protein: item.protein_portions,
            carbs: item.carb_portions,
            fats: item.fat_portions,
          });
        }
      }

      if (items.length === 0) {
        alert("לא זוהו מזונות בתמונה. אנא נסה שוב עם תמונה ברורה יותר.");
        setIsAnalyzing(false);
        return;
      }
      
      setAnalyzedItems(items);
      const initialChecked: { [key: number]: boolean } = {};
      items.forEach((_, index) => {
        initialChecked[index] = true;
      });
      setCheckedItems(initialChecked);
      setShowResults(true);
    } catch (error) {
      logger.error("[AI] Error analyzing image:", error);
      alert("שגיאה בניתוח התמונה. אנא נסה שוב.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!dailyLog?.id || !mealType || analyzedItems.length === 0) return;

    try {
      logger.info("[AI] Adding analyzed items to daily log");
      
      for (let i = 0; i < analyzedItems.length; i++) {
        if (!checkedItems[i]) continue;
        const item = analyzedItems[i];
        const { error } = await supabase
          .from("daily_items")
          .insert([{
            daily_log_id: dailyLog.id,
            food_id: null,
            meal_category: mealType,
            measure_type: "unit",
            quantity: 1,
            grams: 0,
            kcal: item.calories,
            protein_units: item.protein,
            carb_units: item.carbs,
            fat_units: item.fats,
            veg_units: 0,
            fruit_units: 0,
          }]);

        if (error) {
          logger.error("[AI] Error inserting item:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      router.back();
    } catch (error) {
      logger.error("[AI] Failed to add items:", error);
      alert("שגיאה בהוספת הפריטים");
    }
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const toggleItemCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getMacroColor = (type: 'protein' | 'carbs' | 'fats' | 'veg' | 'fruit') => {
    switch (type) {
      case 'protein':
        return '#FFD6D6';
      case 'carbs':
        return '#FFF9CC';
      case 'fats':
        return '#D6F5D6';
      case 'veg':
        return '#FFE4CC';
      case 'fruit':
        return '#FFD6F0';
      default:
        return '#F7FAFC';
    }
  };

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
        <Text style={styles.headerTitle}>ניתוח AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <Camera size={80} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>צלם את הצלחת שלך</Text>
            <Text style={styles.emptySubtitle}>
              ה-AI יזהה את המזון ויחשב את הערכים התזונתיים
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Camera size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.cameraButtonText}>פתח מצלמה</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickFromGallery}
                activeOpacity={0.8}
              >
                <ImageIcon size={24} color={colors.primary} strokeWidth={2} />
                <Text style={styles.galleryButtonText}>בחר מהגלריה</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconContainer}>
                  <RefreshCw size={24} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.instructionText}>
                  לא קיבלתם ערכים? הכל טוב - קורה, פשוט תנסו שוב.
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconContainer}>
                  <Utensils size={24} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.instructionText}>
                  הפרידו בין המאכלים על הצלחת, לצורך העלאת רמת הדיוק
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconContainer}>
                  <Lightbulb size={24} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.instructionText}>
                  תאורה טובה - על מנת שהכלי יוכל לזהות כמה שיותר פרטים
                </Text>
              </View>
            </View>

            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                האפליקציה עושה שימוש במערכות בינה מלאכותית (AI) לצורך ניתוח נתונים, מתן הערכות והצגת מידע.
                המידע המוצג הוא בגדר המלצה בלבד ואינו מהווה ייעוץ רפואי, תזונתי או מקצועי מחייב.
                השימוש בתכנים המוצגים הוא על אחריות המשתמש בלבד.
                בכל שאלה או צורך מותאם אישית יש לפנות לאיש מקצוע מוסמך.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <View style={styles.retakeButtonsContainer}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Camera size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.retakeButtonText}>צלם שוב</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={pickFromGallery}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.retakeButtonText}>גלריה</Text>
                </TouchableOpacity>
              </View>
            </View>

            {plateDescription && showResults && !isAnalyzing && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{plateDescription}</Text>
              </View>
            )}

            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzingText}>מנתח תמונה...</Text>
              </View>
            )}

            {showResults && !isAnalyzing && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>מה יש לנו בצלחת?</Text>
                
                <View style={styles.gridContainer}>
                  {analyzedItems.map((item, index) => {
                    const isChecked = checkedItems[index];
                    return (
                      <View
                        key={index}
                        style={[
                          styles.foodItemCard,
                          { opacity: isChecked ? 1 : 0.1 },
                        ]}
                      >
                        <View style={styles.foodItemTopRow}>
                          <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={[styles.checkboxContainer, { opacity: 1 }]}
                            onPress={() => toggleItemCheck(index)}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.checkboxBox,
                              isChecked && styles.checkboxBoxChecked
                            ]}>
                              {isChecked && (
                                <Check
                                  size={16}
                                  color="#000000"
                                  strokeWidth={3}
                                />
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.foodItemContent}>
                          <Text style={styles.foodItemName}>{item.name}</Text>
                          
                          <View style={styles.foodItemMacros}>
                            <View style={styles.macroItem}>
                              <Text style={styles.calorieText}>{item.calories} קק&quot;ל</Text>
                            </View>
                            {item.protein > 0 && (
                              <View style={[styles.macroItemColored, { backgroundColor: getMacroColor('protein') }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                                  style={styles.macroIconSmall}
                                  resizeMode="contain"
                                />
                                <Text style={styles.macroTextBlack}>{formatUnit(item.protein)}</Text>
                              </View>
                            )}
                            {item.carbs > 0 && (
                              <View style={[styles.macroItemColored, { backgroundColor: getMacroColor('carbs') }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                                  style={styles.macroIconSmall}
                                  resizeMode="contain"
                                />
                                <Text style={styles.macroTextBlack}>{formatUnit(item.carbs)}</Text>
                              </View>
                            )}
                            {item.fats > 0 && (
                              <View style={[styles.macroItemColored, { backgroundColor: getMacroColor('fats') }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                                  style={styles.macroIconSmall}
                                  resizeMode="contain"
                                />
                                <Text style={styles.macroTextBlack}>{formatUnit(item.fats)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Summary Card */}
                {(() => {
                  const checkedIndexes = Object.keys(checkedItems).filter(k => checkedItems[parseInt(k)]);
                  const totalCalories = checkedIndexes.reduce((sum, idx) => sum + analyzedItems[parseInt(idx)].calories, 0);
                  const totalProtein = checkedIndexes.reduce((sum, idx) => sum + analyzedItems[parseInt(idx)].protein, 0);
                  const totalCarbs = checkedIndexes.reduce((sum, idx) => sum + analyzedItems[parseInt(idx)].carbs, 0);
                  const totalFats = checkedIndexes.reduce((sum, idx) => sum + analyzedItems[parseInt(idx)].fats, 0);

                  const proteinProgress = goals?.protein ? Math.min(totalProtein / goals.protein, 1) : 0;
                  const carbProgress = goals?.carb ? Math.min(totalCarbs / goals.carb, 1) : 0;
                  const fatProgress = goals?.fat ? Math.min(totalFats / goals.fat, 1) : 0;

                  const macroData = [
                    { 
                      type: 'protein', 
                      value: totalProtein, 
                      progress: proteinProgress,
                      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984876/steak_6_ahllay.webp",
                      name: 'חלבון'
                    },
                    { 
                      type: 'carbs', 
                      value: totalCarbs, 
                      progress: carbProgress,
                      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984847/bread-slice_3_pvs0tu.webp",
                      name: 'פחמימה'
                    },
                    { 
                      type: 'fats', 
                      value: totalFats, 
                      progress: fatProgress,
                      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_5_joifcx.webp",
                      name: 'שומן'
                    },
                  ];

                  return (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>סיכום</Text>
                      <View style={styles.summaryCalories}>
                        <Text style={styles.summaryCaloriesText}>{Math.round(totalCalories)} קק״ל</Text>
                      </View>
                      <View style={styles.summaryMacros}>
                        {macroData.map((macro, index) => (
                          <View key={index} style={styles.summaryMacroItem}>
                            <Text style={styles.summaryMacroValue}>
                              מנות x{formatUnit(macro.value)}
                            </Text>
                            <View style={styles.summaryIconContainer}>
                              <Image
                                source={{ uri: macro.icon }}
                                style={styles.summaryMacroIconBase}
                                resizeMode="contain"
                              />
                              {macro.value > 0 && (
                                <View style={[styles.summaryIconProgressWrapper, { height: `${macro.progress * 100}%` }]}>
                                  <Image
                                    source={{ uri: macro.icon }}
                                    style={styles.summaryMacroIconProgress}
                                    resizeMode="contain"
                                  />
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>אשר והוסף</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F5",
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
    backgroundColor: "#000000",
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginTop: 24,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#718096",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 32,
  },
  cameraButton: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  galleryButton: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  imageContainer: {
    marginBottom: 16,
    marginTop: 20,
  },
  selectedImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  descriptionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "center",
    lineHeight: 24,
  },
  retakeButtonsContainer: {
    position: "absolute" as const,
    bottom: 16,
    right: 16,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 8,
  },
  retakeButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  analyzingContainer: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  resultsContainer: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  foodItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "48%" as any,
    position: "relative" as const,
  },
  foodItemTopRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodItemContent: {
    flex: 1,
    gap: 8,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
  },
  foodItemName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  foodItemQuantity: {
    fontSize: 14,
    color: "#718096",
  },
  foodItemMacros: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    gap: 12,
  },
  macroItem: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  macroItemColored: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  macroIconSmall: {
    width: 20,
    height: 20,
  },
  macroText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  macroTextBlack: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#000000",
  },
  calorieText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  actionsContainer: {
    marginTop: 8,
  },
  confirmButton: {
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
  instructionsContainer: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionItem: {
    flexDirection: "column" as any,
    alignItems: "center",
    gap: 12,
  },
  instructionIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 150, 136, 0.1)",
    borderRadius: 24,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
    lineHeight: 20,
    textAlign: "center",
  },
  disclaimerContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#718096",
    lineHeight: 16,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  summaryCalories: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  summaryCaloriesText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  summaryMacros: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-evenly",
    gap: 24,
  },
  summaryMacroItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  summaryMacroValue: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  summaryIconContainer: {
    position: "relative" as const,
    width: 50,
    height: 50,
  },
  summaryMacroIconBase: {
    position: "absolute" as const,
    width: 50,
    height: 50,
    tintColor: "#3d3d3d",
  },
  summaryIconProgressWrapper: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  summaryMacroIconProgress: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
  },
});
