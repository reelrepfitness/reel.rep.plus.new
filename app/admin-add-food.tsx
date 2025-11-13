import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { Plus, Search, Edit, Database } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isRTL } from '@/lib/utils';

type FoodManagementTab = "food_bank" | "restaurants" | "barcodes";

export default function AdminAddFoodScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FoodManagementTab>("food_bank");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: foodBankStats, isLoading: statsLoading } = useQuery({
    queryKey: ["foodBankStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_bank")
        .select("id, category");

      if (error) throw error;

      const categories = new Set(data.map(item => item.category));
      return {
        totalItems: data.length,
        categories: categories.size,
        recentUpdates: 0,
      };
    },
    enabled: user?.role === "admin",
  });

  const { data: restaurantStats } = useQuery({
    queryKey: ["restaurantStats"],
    queryFn: async () => {
      const [restaurantsRes, menuItemsRes] = await Promise.all([
        supabase.from("restaurants").select("id"),
        supabase.from("restaurant_menu_items").select("id"),
      ]);

      return {
        restaurants: restaurantsRes.data?.length || 0,
        menuItems: menuItemsRes.data?.length || 0,
        newThisMonth: 0,
      };
    },
    enabled: user?.role === "admin",
  });

  const handleNavigate = (path: string) => {
    router.push(path as any);
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
            title: "הוסף מזון",
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
          title: "הוסף מזון",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "food_bank" && styles.tabActive]}
          onPress={() => setActiveTab("food_bank")}
          activeOpacity={0.8}
        >
          <Database size={18} color={activeTab === "food_bank" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "food_bank" && styles.tabTextActive]}>
            בנק מזון
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "restaurants" && styles.tabActive]}
          onPress={() => setActiveTab("restaurants")}
          activeOpacity={0.8}
        >
          <Database size={18} color={activeTab === "restaurants" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "restaurants" && styles.tabTextActive]}>
            מסעדות
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "barcodes" && styles.tabActive]}
          onPress={() => setActiveTab("barcodes")}
          activeOpacity={0.8}
        >
          <Database size={18} color={activeTab === "barcodes" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "barcodes" && styles.tabTextActive]}>
            ברקודים
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מזון..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.mainSection}>
          {activeTab === "food_bank" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>בנק מזון</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleNavigate("/food-bank")}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>הוסף/ערוך</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ניהול בנק מזון</Text>
                <Text style={styles.infoText}>
                  כאן תוכל להוסיף, לערוך ולמחוק פריטי מזון מהבנק. כל פריט כולל מידע תזונתי מפורט כמו קלוריות, חלבון, פחמימות ושומן.
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{statsLoading ? "..." : foodBankStats?.totalItems || 0}</Text>
                    <Text style={styles.statLabel}>פריטים</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{statsLoading ? "..." : foodBankStats?.categories || 0}</Text>
                    <Text style={styles.statLabel}>קטגוריות</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{statsLoading ? "..." : foodBankStats?.recentUpdates || 0}</Text>
                    <Text style={styles.statLabel}>עדכונים השבוע</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsList}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/admin-add-food-new")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Plus size={24} color={colors.primary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>מזון חדש</Text>
                    <Text style={styles.actionDescription}>צור פריט מזון חדש בבנק המזון</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/admin-edit-food")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Edit size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>ערוך מזון קיים</Text>
                    <Text style={styles.actionDescription}>עדכן מידע תזונתי של פריטים קיימים</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === "restaurants" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>מסעדות</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleNavigate("/restaurants")}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>הוסף/ערוך</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ניהול מסעדות</Text>
                <Text style={styles.infoText}>
                  הוסף מסעדות חדשות ומנות מתפריטים של מסעדות קיימות. כל מנה כוללת חישוב תזונתי מדויק.
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{restaurantStats?.restaurants || 0}</Text>
                    <Text style={styles.statLabel}>מסעדות</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{restaurantStats?.menuItems || 0}</Text>
                    <Text style={styles.statLabel}>מנות</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{restaurantStats?.newThisMonth || 0}</Text>
                    <Text style={styles.statLabel}>חדשות החודש</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsList}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/restaurants")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Plus size={24} color={colors.primary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>הוסף מסעדה חדשה</Text>
                    <Text style={styles.actionDescription}>הוסף מסעדה חדשה למערכת</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/restaurants")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Edit size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>עדכן תפריט</Text>
                    <Text style={styles.actionDescription}>הוסף או ערוך מנות בתפריט מסעדה</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === "barcodes" && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>ברקודים</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleNavigate("/barcode-scanner")}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>סרוק/הוסף</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ניהול ברקודים</Text>
                <Text style={styles.infoText}>
                  סרוק ברקודים של מוצרים והוסף אותם למערכת. כל מוצר יכלול מידע תזונתי מלא.
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>1,234</Text>
                    <Text style={styles.statLabel}>ברקודים</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>89</Text>
                    <Text style={styles.statLabel}>החודש</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>היום</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsList}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/barcode-scanner")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Plus size={24} color={colors.primary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>סרוק ברקוד</Text>
                    <Text style={styles.actionDescription}>סרוק ברקוד והוסף מוצר חדש</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleNavigate("/barcode-scanner")}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIcon}>
                    <Edit size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>ערוך ברקוד</Text>
                    <Text style={styles.actionDescription}>עדכן מידע של מוצר קיים</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  tabsContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginStart: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  mainSection: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  addButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: isRTL ? "right" : "left",
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginStart: 16,
  },
  actionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#718096",
  },
});
