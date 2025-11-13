import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Edit, Save, X, Search, Trash2 } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FoodBankItem } from "@/lib/types";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminEditFood');

export default function AdminEditFoodScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodBankItem | null>(null);
  const [editData, setEditData] = useState<Partial<FoodBankItem>>({});

  const { data: foodItems = [], isLoading } = useQuery({
    queryKey: ["foodBank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_bank")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as FoodBankItem[];
    },
  });

  const filteredItems = foodItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateFoodMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFood) return;
      
      const { data, error } = await supabase
        .from("food_bank")
        .update(editData)
        .eq("id", selectedFood.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodBank"] });
      Alert.alert("הצלחה", "פריט המזון עודכן בהצלחה");
      setSelectedFood(null);
      setEditData({});
    },
    onError: (error: any) => {
      logger.error("[AdminEditFood] Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בעדכון פריט המזון");
    }
  });

  const deleteFoodMutation = useMutation({
    mutationFn: async (foodId: number) => {
      const { error } = await supabase
        .from("food_bank")
        .delete()
        .eq("id", foodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodBank"] });
      Alert.alert("הצלחה", "פריט המזון נמחק בהצלחה");
      setSelectedFood(null);
    },
    onError: (error: any) => {
      logger.error("[AdminEditFood] Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה במחיקת פריט המזון");
    }
  });

  const handleSelectFood = (food: FoodBankItem) => {
    setSelectedFood(food);
    setEditData(food);
  };

  const handleSave = () => {
    updateFoodMutation.mutate();
  };

  const handleDelete = () => {
    if (!selectedFood) return;
    
    Alert.alert(
      "מחיקת פריט",
      `האם אתה בטוח שברצונך למחוק את "${selectedFood.name}"?`,
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "מחק", 
          style: "destructive",
          onPress: () => deleteFoodMutation.mutate(selectedFood.id)
        }
      ]
    );
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
            title: "ערוך מזון",
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
          title: "ערוך מזון",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color="#999" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מזון..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <X color="#999" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>לא נמצאו פריטים</Text>
            </View>
          ) : (
            <View style={styles.foodList}>
              {filteredItems.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={styles.foodCard}
                  onPress={() => handleSelectFood(food)}
                  activeOpacity={0.8}
                >
                  <View style={styles.foodCardContent}>
                    <View style={styles.foodCardInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodCategory}>{food.category}</Text>
                    </View>
                    <Edit size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedFood(null)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>ערוך: {selectedFood?.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <X size={24} color="#2d3748" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>שם המזון</Text>
                  <TextInput
                    style={styles.input}
                    value={editData.name || ""}
                    onChangeText={(text) => setEditData({ ...editData, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>קטגוריה</Text>
                  <TextInput
                    style={styles.input}
                    value={editData.category || ""}
                    onChangeText={(text) => setEditData({ ...editData, category: text })}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>קלוריות</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.caloreis_per_unit?.toString() || ""}
                      onChangeText={(text) => setEditData({ ...editData, caloreis_per_unit: parseFloat(text) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>חלבון</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.protien_units?.toString() || ""}
                      onChangeText={(text) => setEditData({ ...editData, protien_units: parseFloat(text) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>פחמימה</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.carb_units?.toString() || ""}
                      onChangeText={(text) => setEditData({ ...editData, carb_units: parseFloat(text) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>שומן</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.fats_units?.toString() || ""}
                      onChangeText={(text) => setEditData({ ...editData, fats_units: parseFloat(text) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={updateFoodMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {updateFoodMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Save size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>שמור</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    disabled={deleteFoodMutation.isPending}
                    activeOpacity={0.8}
                  >
                    {deleteFoodMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Trash2 size={20} color="#FFFFFF" />
                        <Text style={styles.deleteButtonText}>מחק</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  foodList: {
    gap: 12,
    paddingTop: 16,
  },
  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  foodCardContent: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
  },
  foodCardInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  foodCategory: {
    fontSize: 13,
    color: "#718096",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  deleteButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
