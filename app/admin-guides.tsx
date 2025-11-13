import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { BookOpen, Plus, FileText } from "lucide-react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isRTL } from '@/lib/utils';

export default function AdminGuidesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createGuideMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) {
        throw new Error("יש למלא את כל השדות");
      }

      const { data, error } = await supabase
        .from("guides")
        .insert([{
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      setTitle("");
      setContent("");
      Alert.alert("הצלחה", "המדריך נוסף בהצלחה", [
        { text: "אישור", onPress: () => router.push("/guides") },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("שגיאה", error.message || "אירעה שגיאה בהוספת המדריך");
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
            title: "מדריכים",
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
          title: "מדריכים",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Plus size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>הוסף מדריך חדש</Text>
          <Text style={styles.subtitle}>
            צור מדריך חדש עבור משתמשי האפליקציה
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <FileText size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>כותרת המדריך</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="לדוגמה: מדריך לתכנון תפריט שבועי"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <BookOpen size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>תוכן המדריך</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="כתוב את תוכן המדריך כאן...\nניתן לכלול טיפים, הוראות, דוגמאות ועוד"
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              createGuideMutation.isPending && styles.createButtonDisabled,
            ]}
            onPress={() => createGuideMutation.mutate()}
            activeOpacity={0.8}
            disabled={createGuideMutation.isPending}
          >
            {createGuideMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>צור מדריך</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewGuidesButton}
            onPress={() => router.push("/guides")}
            activeOpacity={0.8}
          >
            <BookOpen size={20} color={colors.primary} />
            <Text style={styles.viewGuidesButtonText}>צפה בכל המדריכים</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
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
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    minHeight: 200,
    paddingTop: 14,
  },
  createButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  viewGuidesButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  viewGuidesButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
  },
});
