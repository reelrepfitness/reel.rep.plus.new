import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { Settings, Bell, Database, Key, Shield, Save } from "lucide-react-native";
import { isRTL } from '@/lib/utils';

export default function AdminSettingsScreen() {
  const { user } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [defaultProteinRatio, setDefaultProteinRatio] = useState("30");
  const [defaultCarbRatio, setDefaultCarbRatio] = useState("40");
  const [defaultFatRatio, setDefaultFatRatio] = useState("30");

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
            title: "הגדרות",
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
          title: "הגדרות",
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>התראות</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#D1D5DB", true: colors.primary }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>התראות Push</Text>
                <Text style={styles.settingDescription}>קבל התראות ישירות לטלפון</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#D1D5DB", true: colors.primary }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>התראות במייל</Text>
                <Text style={styles.settingDescription}>קבל דוחות ועדכונים למייל</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>יחסי מאקרו ברירת מחדל</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={defaultProteinRatio}
                onChangeText={setDefaultProteinRatio}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputLabel}>חלבון (%)</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={defaultCarbRatio}
                onChangeText={setDefaultCarbRatio}
                keyboardType="numeric"
                placeholder="40"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputLabel}>פחמימות (%)</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={defaultFatRatio}
                onChangeText={setDefaultFatRatio}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputLabel}>שומן (%)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>גיבוי ואבטחה</Text>
          </View>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: "#D1D5DB", true: colors.primary }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>גיבוי אוטומטי</Text>
                <Text style={styles.settingDescription}>גיבוי יומי של כל הנתונים</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Key size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>ניהול מפתחות API</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>הרשאות מנהלים</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Save size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>שמור שינויים</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  settingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
    alignItems: "flex-end",
    marginEnd: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#718096",
  },
  inputRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#2d3748",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 80,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  actionButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  saveButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
