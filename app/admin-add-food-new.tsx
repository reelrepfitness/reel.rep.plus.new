import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Save, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminAddFoodNew');

export default function AdminAddFoodNewScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [category, setCategory] = useState("חלבון");
  const [subCategory, setSubCategory] = useState("");
  const [caloriesPerUnit, setCaloriesPerUnit] = useState("");
  const [proteinUnits, setProteinUnits] = useState("");
  const [carbUnits, setCarbUnits] = useState("");
  const [fatUnits, setFatUnits] = useState("");
  const [vegUnits, setVegUnits] = useState("");
  const [fruitUnits, setFruitUnits] = useState("");
  const [gramsPerSingleItem, setGramsPerSingleItem] = useState("");
  const [itemsPerUnit, setItemsPerUnit] = useState("");
  const [gramsPerCup, setGramsPerCup] = useState("");
  const [gramsPerTbsp, setGramsPerTbsp] = useState("");
  const [notes, setNotes] = useState("");

  const categories = ["חלבון", "פחמימה", "שומן", "ירק", "פרי", "ממרחים", "מכולת"];

  const addFoodMutation = useMutation({
    mutationFn: async () => {
      logger.info("[AdminAddFoodNew] Adding new food item:", name);
      
      const { data, error } = await supabase
        .from("food_bank")
        .insert([{
          name,
          img_url: imgUrl || null,
          category,
          sub_category: subCategory || null,
          caloreis_per_unit: parseFloat(caloriesPerUnit) || 0,
          protien_units: parseFloat(proteinUnits) || 0,
          carb_units: parseFloat(carbUnits) || 0,
          fats_units: parseFloat(fatUnits) || 0,
          veg_units: parseFloat(vegUnits) || 0,
          fruit_units: parseFloat(fruitUnits) || 0,
          grams_per_single_item: gramsPerSingleItem ? parseFloat(gramsPerSingleItem) : null,
          items_per_unit: itemsPerUnit ? parseFloat(itemsPerUnit) : null,
          grams_per_cup: gramsPerCup ? parseFloat(gramsPerCup) : null,
          grams_per_tbsp: gramsPerTbsp ? parseFloat(gramsPerTbsp) : null,
          notes: notes || null,
        }])
        .select();

      if (error) {
        logger.error("[AdminAddFoodNew] Error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      logger.info("[AdminAddFoodNew] Food item added successfully");
      queryClient.invalidateQueries({ queryKey: ["foodBank"] });
      Alert.alert("הצלחה", "פריט המזון נוסף בהצלחה", [
        { text: "אישור", onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      logger.error("[AdminAddFoodNew] Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהוספת פריט המזון");
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("שגיאה", "נא להזין שם למזון");
      return;
    }
    
    addFoodMutation.mutate();
  };

  if (user?.role !== "admin") {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: "הוסף מזון חדש",
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>אין לך הרשאות גישה</Text>
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: "הוסף מזון חדש",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>שם המזון *</Text>
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: חזה עוף"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>קישור לתמונה</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#9CA3AF"
              value={imgUrl}
              onChangeText={setImgUrl}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>קטגוריה *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>תת-קטגוריה</Text>
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: עוף, בשר"
              placeholderTextColor="#9CA3AF"
              value={subCategory}
              onChangeText={setSubCategory}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.formGroup}>
            <Text style={styles.label}>קלוריות למנה</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              placeholderTextColor="#9CA3AF"
              value={caloriesPerUnit}
              onChangeText={setCaloriesPerUnit}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>מנות חלבון</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={proteinUnits}
                onChangeText={setProteinUnits}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>מנות פחמימה</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={carbUnits}
                onChangeText={setCarbUnits}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>מנות שומן</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={fatUnits}
                onChangeText={setFatUnits}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>מנות ירקות</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={vegUnits}
                onChangeText={setVegUnits}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>מנות פירות</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={fruitUnits}
              onChangeText={setFruitUnits}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>מידות (אופציונלי)</Text>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>גרם ליחידה</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#9CA3AF"
                value={gramsPerSingleItem}
                onChangeText={setGramsPerSingleItem}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>יחידות למנה</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                value={itemsPerUnit}
                onChangeText={setItemsPerUnit}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>גרם לכוס</Text>
              <TextInput
                style={styles.input}
                placeholder="240"
                placeholderTextColor="#9CA3AF"
                value={gramsPerCup}
                onChangeText={setGramsPerCup}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>גרם לכף</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor="#9CA3AF"
                value={gramsPerTbsp}
                onChangeText={setGramsPerTbsp}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>הערות</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="הערות נוספות..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              addFoodMutation.isPending && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={addFoodMutation.isPending}
            activeOpacity={0.8}
          >
            {addFoodMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>שמור</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    minHeight: 100,
  },
  categoryGrid: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
