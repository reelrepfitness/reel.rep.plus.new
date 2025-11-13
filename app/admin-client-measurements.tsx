import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Scale, Ruler, TrendingUp, Weight, Percent, User } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { BodyMeasurement } from "@/lib/types";
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { ChartContainer } from '@/components/charts/chart-container';
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminClientMeasurements');

const screenWidth = Dimensions.get("window").width;

export default function AdminClientMeasurementsScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMeasurements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error: any) {
      logger.error("[AdminClientMeasurements] Error loading measurements:", error);
      setError(error?.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const latestMeasurement = measurements[measurements.length - 1];
  const firstMeasurement = measurements[0];

  const waistData = measurements
    .slice(-6)
    .map((m) => {
      const date = new Date(m.measurement_date);
      return {
        x: `${date.getDate()}/${date.getMonth() + 1}`,
        y: m.waist_circumference || 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    })
    .filter((d) => d.y > 0);

  const armData = measurements
    .slice(-6)
    .map((m) => {
      const date = new Date(m.measurement_date);
      return {
        x: `${date.getDate()}/${date.getMonth() + 1}`,
        y: m.arm_circumference || 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    })
    .filter((d) => d.y > 0);

  const thighData = measurements
    .slice(-6)
    .map((m) => {
      const date = new Date(m.measurement_date);
      return {
        x: `${date.getDate()}/${date.getMonth() + 1}`,
        y: m.thigh_circumference || 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    })
    .filter((d) => d.y > 0);

  const weightChange = latestMeasurement && firstMeasurement && latestMeasurement.body_weight && firstMeasurement.body_weight
    ? latestMeasurement.body_weight - firstMeasurement.body_weight
    : 0;
  const bodyFatChange = latestMeasurement && firstMeasurement && latestMeasurement.body_fat_percentage && firstMeasurement.body_fat_percentage
    ? latestMeasurement.body_fat_percentage - firstMeasurement.body_fat_percentage
    : 0;

  const renderBodyCompositionChart = (measurement: BodyMeasurement) => {
    const leanMass = measurement.lean_mass || 0;
    const fatMass = measurement.body_fat_mass || 0;
    const total = leanMass + fatMass;

    if (total === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>אין נתונים להצגה</Text>
        </View>
      );
    }

    const leanColor = "#70eeff";
    const fatColor = "#091e27";

    const chartData = [
      { label: 'מסת הגוף הרזה', value: leanMass, color: leanColor },
      { label: 'מסת שומן', value: fatMass, color: fatColor },
    ];

    return (
      <DoughnutChart
        data={chartData}
        config={{
          height: 250,
          showLabels: true,
          animated: true,
          duration: 1500,
          innerRadius: 0.5,
        }}
      />
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: `מדידות - ${userName || "משתמש"}`,
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: `מדידות - ${userName || "משתמש"}`,
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>שגיאה בטעינת נתונים</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMeasurements}
          >
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
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
          title: `מדידות - ${userName || "משתמש"}`,
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
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => router.push({
            pathname: "/update-measurements",
            params: { userId, userName }
          })}
          activeOpacity={0.8}
        >
          <User color="#FFFFFF" size={24} />
          <Text style={styles.updateButtonText}>עדכון מדידות</Text>
        </TouchableOpacity>

        {measurements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ruler color={colors.gray} size={64} />
            <Text style={styles.emptyTitle}>אין מדידות עדיין</Text>
            <Text style={styles.emptySubtitle}>המדידות של המשתמש יופיעו כאן לאחר שיתווספו</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Percent color={colors.primary} size={32} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>אחוז שומן נוכחי</Text>
                <Text style={styles.summaryValue}>
                  {latestMeasurement?.body_fat_percentage?.toFixed(1) || "0.0"}%
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Weight color={colors.primary} size={32} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>משקל נוכחי</Text>
                <Text style={styles.summaryValue}>
                  {latestMeasurement?.body_weight?.toFixed(1) || "0.0"} ק״ג
                </Text>
              </View>
            </View>

            {latestMeasurement && latestMeasurement.body_weight && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Scale color={colors.primary} size={24} />
                  <Text style={styles.cardTitle}>הרכב משקל הגוף</Text>
                </View>
                <View style={styles.customPieChartContainer}>
                  {renderBodyCompositionChart(latestMeasurement)}
                </View>
              </View>
            )}

            {((measurements.some((m) => m.waist_circumference) && waistData.length > 0) ||
              (measurements.some((m) => m.arm_circumference) && armData.length > 0) ||
              (measurements.some((m) => m.thigh_circumference) && thighData.length > 0)) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TrendingUp color={colors.primary} size={24} />
                  <Text style={styles.cardTitle}>מדידות היקפים</Text>
                </View>
                <View style={styles.chartsGrid}>
                  {measurements.some((m) => m.waist_circumference) && waistData.length > 0 && (
                    <View style={styles.chartWrapper}>
                      <ChartContainer
                        title='היקף מותניים'
                        description='ס״מ'
                      >
                        <LineChart
                          data={waistData}
                          config={{
                            height: 180,
                            showGrid: true,
                            showLabels: true,
                            animated: true,
                            duration: 1200,
                            interactive: true,
                            showYLabels: true,
                            yLabelCount: 5,
                            color: "#4ECDC4",
                          }}
                        />
                      </ChartContainer>
                    </View>
                  )}

                  {measurements.some((m) => m.arm_circumference) && armData.length > 0 && (
                    <View style={styles.chartWrapper}>
                      <ChartContainer
                        title='היקף יד'
                        description='ס״מ'
                      >
                        <LineChart
                          data={armData}
                          config={{
                            height: 180,
                            showGrid: true,
                            showLabels: true,
                            animated: true,
                            duration: 1200,
                            interactive: true,
                            showYLabels: true,
                            yLabelCount: 5,
                            color: "#FFD93D",
                          }}
                        />
                      </ChartContainer>
                    </View>
                  )}

                  {measurements.some((m) => m.thigh_circumference) && thighData.length > 0 && (
                    <View style={styles.chartWrapper}>
                      <ChartContainer
                        title='היקף ירך'
                        description='ס״מ'
                      >
                        <LineChart
                          data={thighData}
                          config={{
                            height: 180,
                            showGrid: true,
                            showLabels: true,
                            animated: true,
                            duration: 1200,
                            interactive: true,
                            showYLabels: true,
                            yLabelCount: 5,
                            color: "#6BCB77",
                          }}
                        />
                      </ChartContainer>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "600" as const,
    textAlign: "center",
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
  chartsGrid: {
    gap: 20,
  },
  chartWrapper: {
    marginBottom: 16,
  },
});
