import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, Image } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/constants/colors";
import { useMemo } from "react";
import { User, Edit, Activity, ChefHat, ArrowLeft } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('UserDashboard');

export default function UserDashboardScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["user-calories-7days", userId],
    queryFn: async () => {
      logger.info("[UserDashboard] Fetching 7-day calorie data for user:", userId);

      const today = new Date();
      const dates: string[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dates.push(dateStr);
      }

      const { data: logs, error } = await supabase
        .from("daily_logs")
        .select("date, total_kcal, total_protein_units, total_carb_units, total_fat_units, total_fruit_units, total_veg_units")
        .eq("user_id", userId)
        .in("date", dates);

      if (error) {
        logger.error("[UserDashboard] Error fetching logs:", error);
        throw error;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("kcal_goal, protein_units, carb_units, fat_units, fruit_units, veg_units, weekly_cardio_minutes, weekly_strength_workouts")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        logger.error("[UserDashboard] Error fetching profile:", profileError);
      }

      logger.info("[UserDashboard] Profile data:", profile);

      const logsMap = new Map(logs?.map(log => [log.date, log]) || []);
      
      const weekData = dates.map((date, index) => {
        const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
        const dateObj = new Date(date);
        const dayIndex = dateObj.getDay();
        const log = logsMap.get(date);
        
        return {
          date,
          dayName: dayNames[dayIndex],
          calories: log?.total_kcal || 0,
        };
      });

      logger.info("[UserDashboard] Week data:", weekData);

      const lastLog = logsMap.get(dates[dates.length - 1]);

      const { data: measurements, error: measurementsError } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("measurement_date", { ascending: true });

      if (measurementsError) {
        logger.error("[UserDashboard] Error fetching measurements:", measurementsError);
      }

      const getCurrentWeekRange = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const formatDateString = (d: Date) => {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        };
        
        return {
          start: formatDateString(startOfWeek),
          end: formatDateString(endOfWeek),
        };
      };

      const { start, end } = getCurrentWeekRange();
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", start)
        .lte("log_date", end);

      const strengthLogs = workoutLogs?.filter((log) => log.workout_type === "strength") || [];
      const cardioLogs = workoutLogs?.filter((log) => log.workout_type === "cardio") || [];

      const totalStrengthWorkouts = strengthLogs.reduce((sum, log) => sum + Number(log.amount), 0);
      const totalCardioMinutes = cardioLogs.reduce((sum, log) => sum + Number(log.amount), 0);

      return {
        weekData,
        goal: profile?.kcal_goal || 0,
        lastLog,
        profile,
        measurements: measurements || [],
        workoutData: {
          totalStrengthWorkouts,
          totalCardioMinutes,
          weeklyStrengthGoal: profile?.weekly_strength_workouts || 0,
          weeklyCardioGoal: profile?.weekly_cardio_minutes || 0,
        },
      };
    },
    enabled: !!userId,
  });

  const maxCalories = useMemo(() => {
    if (!data) return 0;
    const max = Math.max(...data.weekData.map(d => d.calories), data.goal);
    return max;
  }, [data]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: false,
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
          headerShown: false,
        }}
      />
      <View style={styles.stickyNotch}>
        <View style={styles.notchRow1}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <User color="#FFFFFF" size={28} />
          <View style={styles.backButton} />
        </View>
        <View style={styles.notchRow2}>
          <Text style={styles.notchText}>{userName || "משתמש"}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>צריכת קלוריות שבועית</Text>
          <Text style={styles.subtitle}>7 ימים אחרונים</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {data?.weekData.slice().reverse().map((day, index) => {
              const heightPercent = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
              const isToday = index === 0;
              
              return (
                <View key={day.date} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={styles.barOuterLayer3}>
                      <View style={styles.barOuterLayer2}>
                        <View style={styles.barOuterLayer1}>
                          <View style={styles.barBackground}>
                            <View 
                              style={[
                                styles.barFill, 
                                { 
                                  height: `${heightPercent}%`,
                                  backgroundColor: isToday ? "#70eeff" : "rgba(112, 238, 255, 0.4)",
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.dayLabel}>{day.dayName}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#70eeff" }]} />
              <Text style={styles.legendText}>היום</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "rgba(112, 238, 255, 0.4)" }]} />
              <Text style={styles.legendText}>ימים קודמים</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(data?.goal || 0)}</Text>
              <Text style={styles.statLabel}>יעד יומי</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {data ? Math.round(data.weekData.reduce((sum, d) => sum + d.calories, 0) / 7) : 0}
              </Text>
              <Text style={styles.statLabel}>ממוצע שבועי</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {data ? Math.round(data.weekData.reduce((sum, d) => {
                  const caloriesLeft = (data.goal || 0) - d.calories;
                  return sum + caloriesLeft;
                }, 0)) : 0}
              </Text>
              <Text style={styles.statLabel}>יתרה שבועית</Text>
            </View>
          </View>
        </View>

        <View style={styles.workoutProgressSection}>
          <Text style={styles.title}>התקדמות אימונים שבועית</Text>
          <View style={styles.workoutCardsRow}>
            <View style={styles.workoutCard}>
              <View style={styles.workoutCardHeader}>
                <Text style={styles.workoutCardTitle}>אימוני כוח בשבוע</Text>
              </View>
              <View style={styles.circularProgressContainer}>
                {(() => {
                  const progress = data?.workoutData?.weeklyStrengthGoal 
                    ? Math.min(data.workoutData.totalStrengthWorkouts / data.workoutData.weeklyStrengthGoal, 1)
                    : 0;
                  const size = 100;
                  const strokeWidth = 10;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (circumference * progress);

                  return (
                    <View style={{ width: size, height: size }}>
                      <Svg width={size} height={size} style={{ position: 'absolute' }}>
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke="#E0E0E0"
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={colors.primary}
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          rotation="-90"
                          origin={`${size / 2}, ${size / 2}`}
                        />
                      </Svg>
                      <View style={styles.progressTextContainer}>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762354881/dumbbell-weightlifting_1_e7zyth.webp" }}
                          style={styles.workoutProgressIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.progressValueText}>
                          {data?.workoutData?.totalStrengthWorkouts || 0}/{data?.workoutData?.weeklyStrengthGoal || 0}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>

            <View style={styles.workoutCard}>
              <View style={styles.workoutCardHeader}>
                <Text style={styles.workoutCardTitle}>דקות אירובי בשבוע</Text>
              </View>
              <View style={styles.circularProgressContainer}>
                {(() => {
                  const progress = data?.workoutData?.weeklyCardioGoal
                    ? Math.min(data.workoutData.totalCardioMinutes / data.workoutData.weeklyCardioGoal, 1)
                    : 0;
                  const size = 100;
                  const strokeWidth = 10;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (circumference * progress);

                  return (
                    <View style={{ width: size, height: size }}>
                      <Svg width={size} height={size} style={{ position: 'absolute' }}>
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke="#E0E0E0"
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={"#FF6B6B"}
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          rotation="-90"
                          origin={`${size / 2}, ${size / 2}`}
                        />
                      </Svg>
                      <View style={styles.progressTextContainer}>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762355479/treadmill_8_ikxtks.webp" }}
                          style={styles.workoutProgressIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.progressValueText}>
                          {data?.workoutData?.totalCardioMinutes || 0}/{data?.workoutData?.weeklyCardioGoal || 0}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: "/admin-client-measurements",
              params: { userId, userName }
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionCardIcon, { backgroundColor: "rgba(63, 205, 209, 0.2)" }]}>
              <Activity color={colors.primary} size={28} />
            </View>
            <Text style={styles.actionCardText}>מדידות</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: "/admin-build-meal-plan",
              params: { userId, userName }
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionCardIcon, { backgroundColor: "rgba(255, 107, 107, 0.2)" }]}>
              <ChefHat color="#FF6B6B" size={28} />
            </View>
            <Text style={styles.actionCardText}>תפריט</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: "/admin-edit-client",
              params: { userId, userName }
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionCardIcon, { backgroundColor: "rgba(255, 215, 0, 0.2)" }]}>
              <Edit color="#FFD700" size={28} />
            </View>
            <Text style={styles.actionCardText}>ערוך</Text>
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
    paddingTop: 140,
    paddingBottom: 150,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleSection: {
    marginBottom: 24,
    marginTop: 24,
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
  chartCard: {
    backgroundColor: "#212121",
    borderRadius: 43,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  chartContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 220,
    marginBottom: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barOuterLayer3: {
    width: "85%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 53, 0.03)",
    borderRadius: 16,
  },
  barOuterLayer2: {
    width: "90%",
    height: "90%",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(38, 33, 53, 0.19)",
    borderRadius: 16,
  },
  barOuterLayer1: {
    width: "88%",
    height: "94%",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#262135",
    borderRadius: 16,
  },
  barBackground: {
    width: "45%",
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 16,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "400" as const,
    color: "rgba(255, 255, 255, 0.71)",
    textAlign: "center",
  },
  legend: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(42, 36, 57, 0.15)",
  },
  legendItem: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500" as const,
  },
  statsRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.71)",
    fontWeight: "500" as const,
  },
  actionCardsRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  actionCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  measurementsTitleSection: {
    marginBottom: 24,
    marginTop: 32,
  },
  summaryRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  cardHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  customPieChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  customPieWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  legendContainer: {
    marginTop: 24,
    gap: 12,
    alignItems: "flex-start",
    alignSelf: "center",
  },
  legendRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 10,
  },
  legendColorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600" as const,
  },
  noDataContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  individualChartContainer: {
    marginBottom: 24,
  },
  individualChartTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  workoutProgressSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  workoutCardsRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 12,
    marginTop: 16,
  },
  workoutCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  workoutCardHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  workoutCardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center",
  },
  circularProgressContainer: {
    position: "relative" as any,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTextContainer: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 4,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  progressGoal: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  workoutProgressIcon: {
    width: 30,
    height: 30,
  },
  progressValueText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.text,
  },
  progressText: {
    marginTop: 12,
    alignItems: "center" as any,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
    textAlign: "center" as any,
  },
  stickyNotch: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notchRow1: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  notchRow2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  notchText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
