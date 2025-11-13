import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminEditClient');

export default function AdminEditClientScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    kcalGoal: "",
    proteinUnits: "",
    carbUnits: "",
    fatUnits: "",
    fruitUnits: "",
    vegUnits: "",
    weeklyCardioMinutes: "",
    weeklyStrengthWorkouts: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-edit", userId],
    queryFn: async () => {
      logger.info("[AdminEditClient] Fetching profile for:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        logger.error("[AdminEditClient] Error fetching profile:", error);
        throw error;
      }

      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        kcalGoal: String(profile.kcal_goal || ""),
        proteinUnits: String(profile.protein_units || ""),
        carbUnits: String(profile.carb_units || ""),
        fatUnits: String(profile.fat_units || ""),
        fruitUnits: String(profile.fruit_units || ""),
        vegUnits: String(profile.veg_units || ""),
        weeklyCardioMinutes: String(profile.weekly_cardio_minutes || ""),
        weeklyStrengthWorkouts: String(profile.weekly_strength_workouts || ""),
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          kcal_goal: Number(formData.kcalGoal) || 0,
          protein_units: Number(formData.proteinUnits) || 0,
          carb_units: Number(formData.carbUnits) || 0,
          fat_units: Number(formData.fatUnits) || 0,
          fruit_units: Number(formData.fruitUnits) || 0,
          veg_units: Number(formData.vegUnits) || 0,
          weekly_cardio_minutes: Number(formData.weeklyCardioMinutes) || 0,
          weekly_strength_workouts: Number(formData.weeklyStrengthWorkouts) || 0,
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-edit", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-calories-7days", userId] });
      Alert.alert("הצלחה", "הפרטים עודכנו בהצלחה");
      router.back();
    },
    onError: (error) => {
      logger.error("[AdminEditClient] Update error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בעדכון הפרטים");
    },
  });

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
            title: "עריכת לקוח",
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

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: `עריכת ${userName || "לקוח"}`,
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          title: `עריכת ${userName || "לקוח"}`,
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>שם מלא</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="הזן שם מלא"
              textAlign="right"
            />
          </View>

          <Text style={styles.sectionTitle}>יעדים תזונתיים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>יעד קלוריות יומי</Text>
            <TextInput
              style={styles.input}
              value={formData.kcalGoal}
              onChangeText={(text) => setFormData({ ...formData, kcalGoal: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות חלבון</Text>
            <TextInput
              style={styles.input}
              value={formData.proteinUnits}
              onChangeText={(text) => setFormData({ ...formData, proteinUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות פחמימות</Text>
            <TextInput
              style={styles.input}
              value={formData.carbUnits}
              onChangeText={(text) => setFormData({ ...formData, carbUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות שומן</Text>
            <TextInput
              style={styles.input}
              value={formData.fatUnits}
              onChangeText={(text) => setFormData({ ...formData, fatUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות פירות</Text>
            <TextInput
              style={styles.input}
              value={formData.fruitUnits}
              onChangeText={(text) => setFormData({ ...formData, fruitUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות ירקות</Text>
            <TextInput
              style={styles.input}
              value={formData.vegUnits}
              onChangeText={(text) => setFormData({ ...formData, vegUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <Text style={styles.sectionTitle}>יעדי אימונים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>דקות אירובי שבועי</Text>
            <TextInput
              style={styles.input}
              value={formData.weeklyCardioMinutes}
              onChangeText={(text) => setFormData({ ...formData, weeklyCardioMinutes: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>אימוני כוח שבועי</Text>
            <TextInput
              style={styles.input}
              value={formData.weeklyStrengthWorkouts}
              onChangeText={(text) => setFormData({ ...formData, weeklyStrengthWorkouts: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, updateMutation.isPending && styles.submitButtonDisabled]}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            activeOpacity={0.8}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save color="#FFFFFF" size={24} />
                <Text style={styles.submitButtonText}>שמור שינויים</Text>
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
    padding: 16,
    paddingBottom: 100,
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
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginTop: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
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
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
});
