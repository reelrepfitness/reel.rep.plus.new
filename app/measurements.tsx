import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Keyboard,
  InputAccessoryView,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Scale, Ruler, TrendingUp, Weight, Percent, X, Activity } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/auth";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BodyMeasurement } from "@/lib/types";
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { AreaChart } from '@/components/charts/area-chart';
import { ChartContainer } from '@/components/charts/chart-container';
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Measurements');

export default function MeasurementsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(true);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWeightSheet, setShowWeightSheet] = useState<boolean>(false);
  const [showBodyFatSheet, setShowBodyFatSheet] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  const loadMeasurements = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.user_id)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error: any) {
      logger.error("Error loading measurements:", error);
      const errorMessage = error?.message || JSON.stringify(error);
      logger.error("Error details:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const handleUpdateWeight = async () => {
    if (!user?.user_id || !newWeight || updating) return;

    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError("נא להזין משקל תקין");
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const { error: insertError } = await supabase
        .from("body_measurements")
        .insert({
          user_id: user.user_id,
          body_weight: weightValue,
          measurement_date: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      await loadMeasurements();
      setNewWeight("");
      setShowWeightSheet(false);
    } catch (error: any) {
      logger.error("Error updating weight:", error);
      setError(error?.message || "שגיאה בעדכון המשקל");
    } finally {
      setUpdating(false);
    }
  };



  const latestMeasurement = measurements[measurements.length - 1];

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



  const bodyWeightData = measurements
    .slice(-6)
    .map((m) => {
      const date = new Date(m.measurement_date);
      return {
        x: `${date.getDate()}/${date.getMonth() + 1}`,
        y: m.body_weight || 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    })
    .filter((d) => d.y > 0);

  const bodyFatData = measurements
    .slice(-6)
    .map((m) => {
      const date = new Date(m.measurement_date);
      return {
        x: `${date.getDate()}/${date.getMonth() + 1}`,
        y: m.body_fat_percentage || 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    })
    .filter((d) => d.y > 0);

  const firstMeasurement = measurements[0];
  const weightChange = latestMeasurement && firstMeasurement && latestMeasurement.body_weight && firstMeasurement.body_weight
    ? latestMeasurement.body_weight - firstMeasurement.body_weight
    : 0;
  const bodyFatChange = latestMeasurement && firstMeasurement && latestMeasurement.body_fat_percentage && firstMeasurement.body_fat_percentage
    ? latestMeasurement.body_fat_percentage - firstMeasurement.body_fat_percentage
    : 0;

  const renderBodyCompositionChart = (measurement: BodyMeasurement) => {
    const leanMass = measurement.body_fat_mass || 0;
    const fatMass = measurement.lean_mass || 0;
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
        <Stack.Screen options={{ headerShown: false }} />
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
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הערכה גופנית</Text>
          <View style={styles.addButton} />
        </View>
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
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.customHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow1}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonNew}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Activity color={colors.white} size={28} />
          <View style={styles.backButtonNew} />
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.customHeaderTitle}>הערכה גופנית</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {measurements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ruler color={colors.gray} size={64} />
            <Text style={styles.emptyTitle}>אין מדידות עדיין</Text>
            <Text style={styles.emptySubtitle}>המדידות שלך יופיעו כאן לאחר שיתווספו</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <TouchableOpacity 
                style={styles.summaryCard}
                onPress={() => setShowBodyFatSheet(true)}
                activeOpacity={0.7}
              >
                <Percent color="#0D7C7E" size={32} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>אחוז שומן נוכחי</Text>
                <Text style={styles.summaryValue}>
                  {latestMeasurement?.body_fat_percentage?.toFixed(1) || "0.0"}%
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.summaryCard}
                onPress={() => setShowWeightSheet(true)}
                activeOpacity={0.7}
              >
                <Weight color="#0D7C7E" size={32} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>משקל נוכחי</Text>
                <Text style={styles.summaryValue}>
                  {latestMeasurement?.body_weight?.toFixed(1) || "0.0"} ק״ג
                </Text>
              </TouchableOpacity>
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

      <Modal
        visible={showWeightSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightSheet(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            Keyboard.dismiss();
            setShowWeightSheet(false);
          }}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowWeightSheet(false)} style={styles.closeButton}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>משקל גוף (ק״ג)</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
              {measurements.some((m) => m.body_weight) && bodyWeightData.length > 0 && (
                <View>
                  <AreaChart
                    data={bodyWeightData}
                    config={{
                      height: 220,
                      showGrid: true,
                      showLabels: true,
                      animated: true,
                      color: colors.primary,
                    }}
                  />
                  {weightChange !== 0 && (
                    <View style={styles.progressText}>
                      <Text style={styles.progressLabel}>
                        עד כה {weightChange > 0 ? "עלית" : "ירדת"} {Math.abs(weightChange).toFixed(1)} ק״ג
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.updateSection}>
                <Text style={styles.updateLabel}>עדכן משקל חדש</Text>
                <TextInput
                  style={styles.input}
                  placeholder="הזן משקל בק״ג"
                  placeholderTextColor={colors.gray}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  inputAccessoryViewID="weightInputDone"
                />
                <TouchableOpacity
                  style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                  onPress={handleUpdateWeight}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.updateButtonText}>עדכן משקל</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
              <InputAccessoryView nativeID="weightInputDone">
                <View style={styles.keyboardAccessory}>
                  <TouchableOpacity 
                    style={styles.keyboardDoneButton}
                    onPress={() => Keyboard.dismiss()}
                  >
                    <Text style={styles.keyboardDoneText}>סגור</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showBodyFatSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBodyFatSheet(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            Keyboard.dismiss();
            setShowBodyFatSheet(false);
          }}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowBodyFatSheet(false)} style={styles.closeButton}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>אחוז שומן בגוף (%)</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
              {measurements.some((m) => m.body_fat_percentage) && bodyFatData.length > 0 && (
                <View>
                  <AreaChart
                    data={bodyFatData}
                    config={{
                      height: 220,
                      showGrid: true,
                      showLabels: true,
                      animated: true,
                      color: colors.primary,
                    }}
                  />
                  {bodyFatChange !== 0 && (
                    <View style={styles.progressText}>
                      <Text style={styles.progressLabel}>
                        עד כה {bodyFatChange > 0 ? "עלית" : "ירדת"} ב-{Math.abs(bodyFatChange).toFixed(1)} אחוז שומן
                      </Text>
                    </View>
                  )}
                </View>
              )}
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
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.white,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeader: {
    backgroundColor: "#000000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow1: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  backButtonNew: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  pieChartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  weightSummary: {
    alignItems: "center",
    marginTop: 8,
  },
  weightTotal: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartNoBg: {
    marginVertical: 8,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  legend: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
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
  summaryRow: {
    flexDirection: "row-reverse",
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
    color: "#2d3748",
    fontWeight: "600" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  progressText: {
    marginTop: 12,
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
    textAlign: "center",
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
    flexDirection: "row-reverse",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  updateSection: {
    marginTop: 24,
    gap: 12,
  },
  updateLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
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
  graphContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardAccessory: {
    backgroundColor: "#F7F7F7",
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "flex-end",
  },
  keyboardDoneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  keyboardDoneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  chartsGrid: {
    gap: 20,
  },
  chartWrapper: {
    marginBottom: 16,
  },
});
