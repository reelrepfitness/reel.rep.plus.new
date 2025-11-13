import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/constants/colors";
import { useMemo } from "react";
import { TrendingUp, Users, Flame, Target, Calendar, Activity } from "lucide-react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminAnalytics');

const screenWidth = Dimensions.get("window").width;

export default function AdminAnalyticsScreen() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", user?.user_id],
    queryFn: async () => {
      logger.info("[AdminAnalytics] Fetching analytics data");

      const today = new Date();
      const last7Days: string[] = [];
      const last30Days: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
      }

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
      }

      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: dailyLogs } = await supabase.from("daily_logs").select("*").in("date", last30Days);
      const { data: foodBank } = await supabase.from("food_bank").select("*");

      const userActivity = last7Days.map((date) => {
        const dayLogs = dailyLogs?.filter((log: any) => log.date === date) || [];
        return {
          date,
          activeUsers: dayLogs.length,
        };
      });

      const avgCalories = dailyLogs?.length
        ? Math.round(dailyLogs.reduce((sum: number, log: any) => sum + (log.total_kcal || 0), 0) / dailyLogs.length)
        : 0;

      const totalMeals = dailyLogs?.reduce((sum: number, log: any) => {
        return sum + (log.total_protein_units || 0) + (log.total_carb_units || 0) + (log.total_fat_units || 0);
      }, 0) || 0;

      return {
        totalUsers: profiles?.length || 0,
        totalFoodItems: foodBank?.length || 0,
        avgCalories,
        totalMeals: Math.round(totalMeals),
        userActivity,
        activeLast30Days: new Set(dailyLogs?.map((log: any) => log.user_id)).size,
      };
    },
    enabled: user?.role === "admin",
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
            title: "דוחות ואנליטיקה",
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
            title: "דוחות ואנליטיקה",
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

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(63, 205, 209, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  const userActivityData = {
    labels: data?.userActivity.map((day) => {
      const date = new Date(day.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || [],
    datasets: [
      {
        data: data?.userActivity.map((day) => day.activeUsers) || [0],
        color: () => colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <LinearGradient
      colors={["#3FCDD1", "#FFFFFF"]}
      locations={[0, 0.4]}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "דוחות ואנליטיקה",
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
        <View style={styles.headerSection}>
          <Text style={styles.title}>סטטיסטיקות כלליות</Text>
          <Text style={styles.subtitle}>נתוני השימוש באפליקציה</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
              <Users size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{data?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>סה"כ משתמשים</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#10B981" }]}>
              <Activity size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{data?.activeLast30Days || 0}</Text>
            <Text style={styles.statLabel}>פעילים ב-30 יום</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#F59E0B" }]}>
              <Flame size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{data?.avgCalories || 0}</Text>
            <Text style={styles.statLabel}>ממוצע קלוריות</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#8B5CF6" }]}>
              <Target size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{data?.totalFoodItems || 0}</Text>
            <Text style={styles.statLabel}>פריטי מזון</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>פעילות משתמשים - 7 ימים</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={userActivityData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>תובנות</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>שיעור מעורבות גבוה</Text>
              <Text style={styles.insightText}>
                {data?.totalUsers ? Math.round((data.activeLast30Days / data.totalUsers) * 100) : 0}% מהמשתמשים היו פעילים ב-30 יום האחרונים
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Calendar size={24} color={colors.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>שיא שבועי</Text>
              <Text style={styles.insightText}>
                היום הכי פעיל השבוע: {data?.userActivity.reduce((max, day) => day.activeUsers > max.activeUsers ? day : max, data.userActivity[0])?.activeUsers || 0} משתמשים
              </Text>
            </View>
          </View>
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
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
  },
  statsGrid: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap" as any,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
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
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginStart: 12,
  },
  insightContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
  },
});
