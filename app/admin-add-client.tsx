import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";
import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react-native";
import { RadioButton } from "@/components/ui/radio";
import { Picker } from "@/components/ui/picker";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminAddClient');

interface Template {
  id: string;
  kcal_plan: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
}

export default function AdminAddClientScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    age: "",
    gender: "" as "male" | "female" | "",
    goal: "" as "חיטוב" | "ניטראלי" | "מסה" | "",
    activity: "" as "רמה 1 - יושבנית במלואה" | "רמה 2 - יושבנית למחצה" | "רמה 3 - חצי פעילה" | "רמה 4 - פעילה" | "",
    bodyWeight: "",
    height: "",
    waterDailyGoal: "12",
    whatsappLink: "",
    foodLimitations: "",
    usersNotes: "",
    mealPlan: false,
    kcalGoal: "",
    proteinUnits: "",
    carbUnits: "",
    fatUnits: "",
    fruitUnits: "",
    vegUnits: "",
    weeklyCardioMinutes: "",
    weeklyStrengthWorkouts: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("target_templates")
        .select("*")
        .order("kcal_plan", { ascending: true });

      if (error) {
        logger.error("[AdminAddClient] Error fetching templates:", error);
        Alert.alert("שגיאה", "לא ניתן לטעון תבניות");
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      logger.error("[AdminAddClient] Error:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setFormData(prev => ({
        ...prev,
        kcalGoal: template.kcal_plan.toString(),
        proteinUnits: template.protein_units.toString(),
        carbUnits: template.carb_units.toString(),
        fatUnits: template.fat_units.toString(),
        vegUnits: template.veg_units.toString(),
        fruitUnits: template.fruit_units.toString(),
      }));
    }
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

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert("שגיאה", "נא למלא את כל השדות הנדרשים");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        logger.error("[AdminAddClient] Auth error:", authError);
        Alert.alert("שגיאה", authError.message);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: "user",
            phone: formData.phone || null,
            age: formData.age || null,
            gender: formData.gender || null,
            goal: formData.goal || null,
            activity: formData.activity || null,
            body_weight: Number(formData.bodyWeight) || null,
            height: Number(formData.height) || null,
            water_daily_goal: Number(formData.waterDailyGoal) || 12,
            whatsapp_link: formData.whatsappLink || null,
            food_limitations: formData.foodLimitations || null,
            users_notes: formData.usersNotes || null,
            meal_plan: formData.mealPlan,
            kcal_goal: Number(formData.kcalGoal) || 0,
            protein_units: Number(formData.proteinUnits) || 0,
            carb_units: Number(formData.carbUnits) || 0,
            fat_units: Number(formData.fatUnits) || 0,
            fruit_units: Number(formData.fruitUnits) || 0,
            veg_units: Number(formData.vegUnits) || 0,
            weekly_cardio_minutes: Number(formData.weeklyCardioMinutes) || 0,
            weekly_strength_workouts: Number(formData.weeklyStrengthWorkouts) || 0,
          });

        if (profileError) {
          logger.error("[AdminAddClient] Profile error:", profileError);
          Alert.alert("שגיאה", "נוצר משתמש אך לא ניתן לעדכן את הפרופיל");
        } else {
          Alert.alert("הצלחה", "לקוח חדש נוסף בהצלחה");
          router.back();
        }
      }
    } catch (error) {
      logger.error("[AdminAddClient] Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהוספת הלקוח");
    } finally {
      setIsSubmitting(false);
    }
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
            title: "הוסף לקוח",
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
          title: "הוסף לקוח חדש",
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
          <Text style={styles.sectionTitle}>פרטי התחברות</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>אימייל *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="הזן אימייל"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>סיסמה *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="הזן סיסמה"
              secureTextEntry
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>שם מלא *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="הזן שם מלא"
              textAlign="right"
            />
          </View>

          <Text style={styles.sectionTitle}>פרטים אישיים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>טלפון</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="הזן טלפון"
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>גיל</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="הזן גיל"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מגדר</Text>
            <View style={styles.radioGroup}>
              {[
                { label: 'זכר', value: 'male' },
                { label: 'נקבה', value: 'female' },
              ].map((option) => (
                <RadioButton
                  key={option.value}
                  option={option}
                  selected={formData.gender === option.value}
                  onPress={() => setFormData({ ...formData, gender: option.value as any })}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מטרה</Text>
            <View style={styles.radioGroup}>
              {[
                { label: 'חיטוב', value: 'חיטוב' },
                { label: 'ניטראלי', value: 'ניטראלי' },
                { label: 'מסה', value: 'מסה' },
              ].map((option) => (
                <RadioButton
                  key={option.value}
                  option={option}
                  selected={formData.goal === option.value}
                  onPress={() => setFormData({ ...formData, goal: option.value as any })}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>רמת פעילות</Text>
            <View style={styles.radioGroup}>
              {[
                { label: 'רמה 1 - יושבנית במלואה', value: 'רמה 1 - יושבנית במלואה' },
                { label: 'רמה 2 - יושבנית למחצה', value: 'רמה 2 - יושבנית למחצה' },
                { label: 'רמה 3 - חצי פעילה', value: 'רמה 3 - חצי פעילה' },
                { label: 'רמה 4 - פעילה', value: 'רמה 4 - פעילה' },
              ].map((option) => (
                <RadioButton
                  key={option.value}
                  option={option}
                  selected={formData.activity === option.value}
                  onPress={() => setFormData({ ...formData, activity: option.value as any })}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>משקל גוף (ק״ג)</Text>
            <TextInput
              style={styles.input}
              value={formData.bodyWeight}
              onChangeText={(text) => setFormData({ ...formData, bodyWeight: text })}
              placeholder="0"
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>גובה (ס״מ)</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>יעד צריכת מים יומי (כוסות)</Text>
            <TextInput
              style={styles.input}
              value={formData.waterDailyGoal}
              onChangeText={(text) => setFormData({ ...formData, waterDailyGoal: text })}
              placeholder="12"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          {calculateRMR(
            formData.gender, 
            formData.age, 
            Number(formData.height), 
            Number(formData.bodyWeight)
          ) && (
            <View style={styles.rmrCard}>
              <View style={styles.rmrCardHeader}>
                <Text style={styles.rmrCardTitle}>RMR - קצב חילוף חומרים במנוחה</Text>
              </View>
              <View style={styles.rmrCardBody}>
                <View style={styles.rmrValueContainer}>
                  <Text style={styles.rmrValue}>
                    {calculateRMR(
                      formData.gender, 
                      formData.age, 
                      Number(formData.height), 
                      Number(formData.bodyWeight)
                    )}
                  </Text>
                  <Text style={styles.rmrUnit}>קק"ל</Text>
                </View>
                <View style={styles.rmrDetails}>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{formData.bodyWeight} ק"ג</Text>
                    <Text style={styles.rmrDetailLabel}>משקל:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{formData.height} ס"מ</Text>
                    <Text style={styles.rmrDetailLabel}>גובה:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{formData.age}</Text>
                    <Text style={styles.rmrDetailLabel}>גיל:</Text>
                  </View>
                  <View style={styles.rmrDetailRow}>
                    <Text style={styles.rmrDetailValue}>{formData.gender === "male" ? "זכר" : "נקבה"}</Text>
                    <Text style={styles.rmrDetailLabel}>מגדר:</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rmrFooter}>
                <Text style={styles.rmrFooterText}>חישוב לפי נוסחת Mifflin-St Jeor</Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>קישור וואטסאפ</Text>
            <TextInput
              style={styles.input}
              value={formData.whatsappLink}
              onChangeText={(text) => setFormData({ ...formData, whatsappLink: text })}
              placeholder="הזן קישור וואטסאפ"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מגבלות מזון</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.foodLimitations}
              onChangeText={(text) => setFormData({ ...formData, foodLimitations: text })}
              placeholder="הזן מגבלות מזון"
              textAlign="right"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>הערות</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.usersNotes}
              onChangeText={(text) => setFormData({ ...formData, usersNotes: text })}
              placeholder="הזן הערות"
              textAlign="right"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>תפריט ארוחות</Text>
            <View style={styles.radioGroup}>
              {[
                { label: 'כן', value: 'true' },
                { label: 'לא', value: 'false' },
              ].map((option) => (
                <RadioButton
                  key={option.value}
                  option={option}
                  selected={formData.mealPlan === (option.value === 'true')}
                  onPress={() => setFormData({ ...formData, mealPlan: option.value === 'true' })}
                />
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>יעדים תזונתיים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>בחר תבנית קלוריות</Text>
            {isLoadingTemplates ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <Picker
                value={selectedTemplate}
                onValueChange={(value) => handleTemplateSelect(value as string)}
                placeholder="בחר תבנית..."
                variant="filled"
                options={[
                  { label: "בחר תבנית...", value: "" },
                  ...templates.map(t => ({
                    label: `${t.kcal_plan} קק"ל - חלבון: ${t.protein_units}, פחמימות: ${t.carb_units}, שומן: ${t.fat_units}`,
                    value: t.id,
                  })),
                ]}
              />
            )}
          </View>

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
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus color="#FFFFFF" size={24} />
                <Text style={styles.submitButtonText}>הוסף לקוח</Text>
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
  radioGroup: {
    gap: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
    paddingTop: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  rmrCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  rmrCardHeader: {
    marginBottom: 16,
  },
  rmrCardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FF6B35",
    textAlign: isRTL ? "right" : "left",
  },
  rmrCardBody: {
    gap: 12,
  },
  rmrValueContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  rmrValue: {
    fontSize: 40,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  rmrUnit: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.7)",
  },
  rmrDetails: {
    gap: 6,
  },
  rmrDetailRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rmrDetailLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.8)",
  },
  rmrDetailValue: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#FFFFFF",
  },
  rmrFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  rmrFooterText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontStyle: "italic" as const,
  },
});
