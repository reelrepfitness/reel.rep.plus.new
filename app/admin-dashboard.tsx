import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/constants/colors";
import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Flame, TrendingUp, Activity, Database, Zap, Menu } from "lucide-react-native";
import { AdminMenuSheet } from "@/components/AdminMenuSheet";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminDashboard');

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const startOfDay = useMemo(() => {
    const now = new Date();
    now.setHours(6, 0, 0, 0);
    return now.toISOString();
  }, []);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["admin-dashboard-data", user?.user_id, today],
    queryFn: async () => {
      logger.info("[AdminDashboard] Fetching dashboard data");
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user?.user_id)
        .order("name", { ascending: true });

      if (profilesError) {
        logger.error("[AdminDashboard] Error fetching clients:", profilesError);
        throw profilesError;
      }

      const { data: dailyLogs, error: logsError } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("date", today);

      if (logsError) {
        logger.error("[AdminDashboard] Error fetching daily logs:", logsError);
        throw logsError;
      }

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const { data: measurements, error: measurementsError } = await supabase
        .from("body_measurements")
        .select("user_id, measurement_date")
        .order("measurement_date", { ascending: false });

      if (measurementsError) {
        logger.error("[AdminDashboard] Error fetching measurements:", measurementsError);
      }

      logger.info("[AdminDashboard] Data fetched:", profiles?.length, "clients");
      
      return {
        profiles: profiles as User[],
        dailyLogs: dailyLogs || [],
        measurements: measurements || [],
      };
    },
    enabled: user?.role === "admin",
    refetchInterval: 60000,
  });

  const clients = useMemo(() => clientsData?.profiles || [], [clientsData?.profiles]);
  const dailyLogs = useMemo(() => clientsData?.dailyLogs || [], [clientsData?.dailyLogs]);
  const measurements = useMemo(() => clientsData?.measurements || [], [clientsData?.measurements]);

  const alerts = useMemo(() => {
    const issues = {
      critical: [] as { title: string; name: string; details: string }[],
      warning: [] as { title: string; name: string; details: string }[],
      info: [] as { title: string; name: string; details: string }[],
    };

    const now = new Date();
    const currentHour = now.getHours();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    clients.forEach((client) => {
      const log = dailyLogs.find((l: any) => l.user_id === client.user_id);
      
      if (log && client.kcal_goal && log.total_kcal > client.kcal_goal + 500) {
        issues.critical.push({
          title: "חריגות קלוריות חמורה",
          name: client.name || "ללא שם",
          details: `${Math.round(log.total_kcal - client.kcal_goal)}+ קלוריות מעל יעד`,
        });
      } else if (log && client.kcal_goal && log.total_kcal > client.kcal_goal) {
        issues.warning.push({
          title: "חריגות בקלוריות",
          name: client.name || "ללא שם",
          details: `${Math.round(log.total_kcal - client.kcal_goal)} קלוריות מעל יעד`,
        });
      }

      if (log && (log.water_glasses || 0) < 1) {
        const hoursSinceStart = Math.floor((now.getTime() - new Date(startOfDay).getTime()) / (1000 * 60 * 60));
        if (hoursSinceStart >= 4) {
          issues.critical.push({
            title: "לא שתה מים בכלל",
            name: client.name || "ללא שם",
            details: "לא נרשמה שתיית מים היום",
          });
        }
      }

      if (currentHour >= 12 && !log) {
        issues.warning.push({
          title: "לא נכנס/ה לאפליקציה",
          name: client.name || "ללא שם",
          details: "לא רשם אוכל עד השעה 12:00",
        });
      }

      const clientMeasurements = measurements.filter((m: any) => m.user_id === client.user_id);
      if (clientMeasurements.length > 0) {
        const lastMeasurement = new Date(clientMeasurements[0].measurement_date);
        if (lastMeasurement < twoWeeksAgo) {
          issues.warning.push({
            title: "מדידות לא עודכנו",
            name: client.name || "ללא שם",
            details: "חלפו 2+ שבועות מאז מדידה אחרונה",
          });
        }
      }

      if (log && log.total_protein_units && client.protein_units && 
          Math.abs(log.total_protein_units - client.protein_units) > client.protein_units * 0.3) {
        issues.warning.push({
          title: "חריגות במאקרו חלבון",
          name: client.name || "ללא שם",
          details: `${log.total_protein_units}/${client.protein_units} יחידות`,
        });
      }
    });

    return issues;
  }, [clients, dailyLogs, measurements, startOfDay]);

  const filteredAlerts = useMemo(() => {
    return {
      critical: alerts.critical.filter((_, idx) => !dismissedAlerts.includes(`critical-${idx}`)),
      warning: alerts.warning.filter((_, idx) => !dismissedAlerts.includes(`warning-${idx}`)),
      info: alerts.info,
    };
  }, [alerts, dismissedAlerts]);

  const stats = useMemo(() => {
    return {
      totalClients: clients.length,
      activeToday: dailyLogs.length,
      avgCalories: dailyLogs.length > 0 
        ? Math.round(dailyLogs.reduce((sum: number, log: any) => sum + log.total_kcal, 0) / dailyLogs.length)
        : 0,
      compliance: clients.length > 0 
        ? Math.round((dailyLogs.length / clients.length) * 100)
        : 0,
    };
  }, [clients, dailyLogs]);



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
            title: "מסך ניהול",
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
            headerRight: () => (
              <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={{ paddingHorizontal: 16 }}>
                <Menu size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
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
            title: "מסך ניהול",
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
            headerRight: () => (
              <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={{ paddingHorizontal: 16 }}>
                <Menu size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
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
          title: "מסך ניהול",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={{ paddingHorizontal: 16 }}>
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSectionWrapper}>
          <View style={styles.glassContainer}>
            <View style={styles.glassOuter} />
            <View style={styles.glassInner} />
            <View style={styles.glassBlur} />
            <View style={styles.glassHighlight} />
            {Platform.OS !== 'web' ? (
              <BlurView intensity={Platform.OS === 'ios' ? 20 : 10} style={styles.blurOverlay} />
            ) : (
              <View style={styles.webBlurFallback} />
            )}
            <View style={styles.headerSection}>
              <Text style={styles.welcomeText}>שלום, איוון</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Activity color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statValue}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>סה&quot;כ לקוחות</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#34D399" }]}>
              <TrendingUp color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statValue}>{stats.activeToday}</Text>
            <Text style={styles.statLabel}>פעילים היום</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#F59E0B" }]}>
              <Flame color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statValue}>{stats.avgCalories}</Text>
            <Text style={styles.statLabel}>ממוצע קלוריות</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#8B5CF6" }]}>
              <Zap color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statValue}>{stats.compliance}%</Text>
            <Text style={styles.statLabel}>שיעור עמידה</Text>
          </View>
        </View>

        <View style={styles.notificationsSection}>
          <View style={styles.notificationHeader}>
            <Text style={styles.sectionTitle}>התראות קריטיות</Text>
            <View style={styles.notificationHeaderActions}>
              {(filteredAlerts.critical.length > 0 || filteredAlerts.warning.length > 0) && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {filteredAlerts.critical.length + filteredAlerts.warning.length}
                  </Text>
                </View>
              )}
              {(filteredAlerts.critical.length > 0 || filteredAlerts.warning.length > 0) && (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={() => {
                    const allAlertIds = [
                      ...alerts.critical.map((_, idx) => `critical-${idx}`),
                      ...alerts.warning.map((_, idx) => `warning-${idx}`),
                    ];
                    setDismissedAlerts(allAlertIds);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearAllText}>נקה הכל</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {filteredAlerts.critical.length === 0 && filteredAlerts.warning.length === 0 ? (
            <View style={styles.noAlertsCard}>
              <Text style={styles.noAlertsText}>🎉 אין התראות פתוחות</Text>
              <Text style={styles.noAlertsSubtext}>כל הלקוחות בטווח היעד</Text>
            </View>
          ) : (
            <>
              {filteredAlerts.critical.map((alert, idx) => {
                const originalIdx = alerts.critical.findIndex(a => 
                  a.title === alert.title && a.name === alert.name && a.details === alert.details
                );
                return (
                  <TouchableOpacity key={`critical-${originalIdx}`} style={[styles.alertCard, styles.alertCardCritical]} activeOpacity={0.8}>
                    <View style={styles.alertIconContainer}>
                      <AlertTriangle color="#EF4444" size={24} />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertName}>{alert.name}</Text>
                      <Text style={styles.alertDetails}>{alert.details}</Text>
                    </View>
                    <View style={styles.alertActions}>
                      <View style={[styles.alertBadge, { backgroundColor: "#EF4444" }]}>
                        <Text style={styles.alertBadgeText}>דחוף</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.handleButton}
                        onPress={() => {
                          setDismissedAlerts([...dismissedAlerts, `critical-${originalIdx}`]);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.handleButtonText}>טופל</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filteredAlerts.warning.map((alert, idx) => {
                const originalIdx = alerts.warning.findIndex(a => 
                  a.title === alert.title && a.name === alert.name && a.details === alert.details
                );
                return (
                  <TouchableOpacity key={`warning-${originalIdx}`} style={[styles.alertCard, styles.alertCardWarning]} activeOpacity={0.8}>
                    <View style={styles.alertIconContainer}>
                      <Clock color="#F59E0B" size={24} />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertName}>{alert.name}</Text>
                      <Text style={styles.alertDetails}>{alert.details}</Text>
                    </View>
                    <View style={styles.alertActions}>
                      <View style={[styles.alertBadge, { backgroundColor: "#F59E0B" }]}>
                        <Text style={styles.alertBadgeText}>אזהרה</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.handleButton}
                        onPress={() => {
                          setDismissedAlerts([...dismissedAlerts, `warning-${originalIdx}`]);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.handleButtonText}>טופל</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        <View style={styles.systemSection}>
          <Text style={styles.sectionTitle}>דוחות מערכת</Text>
          
          <TouchableOpacity style={styles.systemCard} activeOpacity={0.8}>
            <View style={styles.systemCardHeader}>
              <View style={styles.systemIconContainer}>
                <Zap color={colors.primary} size={24} />
              </View>
              <Text style={styles.systemCardTitle}>ביצועי אפליקציה</Text>
            </View>
            <View style={styles.systemMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>98ms</Text>
                <Text style={styles.metricLabel}>זמן תגובה ממוצע</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>99.9%</Text>
                <Text style={styles.metricLabel}>זמינות</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.systemCard} activeOpacity={0.8}>
            <View style={styles.systemCardHeader}>
              <View style={[styles.systemIconContainer, { backgroundColor: "#8B5CF6" }]}>
                <Database color="#FFFFFF" size={24} />
              </View>
              <Text style={styles.systemCardTitle}>Supabase</Text>
            </View>
            <View style={styles.systemMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>{dailyLogs.length}</Text>
                <Text style={styles.metricLabel}>רשומות יומיות</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>~{Math.round((dailyLogs.length * 0.5) / 1000)}MB</Text>
                <Text style={styles.metricLabel}>נפח DB</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.systemCard} activeOpacity={0.8}>
            <View style={styles.systemCardHeader}>
              <View style={[styles.systemIconContainer, { backgroundColor: "#10B981" }]}>
                <Activity color="#FFFFFF" size={24} />
              </View>
              <Text style={styles.systemCardTitle}>מעורבות משתמשים</Text>
            </View>
            <View style={styles.systemMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>{stats.activeToday}/{stats.totalClients}</Text>
                <Text style={styles.metricLabel}>DAU (משתמשים פעילים יומיים)</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricValue}>{stats.compliance}%</Text>
                <Text style={styles.metricLabel}>שיעור מעורבות</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AdminMenuSheet open={isMenuOpen} onOpenChange={setIsMenuOpen} currentScreen="dashboard" />
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
  headerSectionWrapper: {
    marginBottom: 24,
    alignItems: "center",
  },
  glassContainer: {
    position: "relative" as const,
    width: "100%",
    minHeight: 84,
    borderRadius: 42,
    overflow: "hidden",
  },
  glassOuter: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(217, 217, 217, 0.5)",
    borderRadius: 42,
  },
  glassInner: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(84, 84, 84, 0.1)",
    borderRadius: 42,
  },
  glassBlur: {
    position: "absolute" as const,
    top: 6,
    left: 5,
    right: 5,
    height: 72,
    backgroundColor: "#D9D9D9",
    borderRadius: 42,
    opacity: 0.3,
  },
  glassHighlight: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 42,
  },
  blurOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 42,
  },
  webBlurFallback: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 42,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1a202c",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#4a5568",
    textAlign: isRTL ? "right" : "left",
    fontWeight: "500" as const,
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
    backgroundColor: colors.primary,
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
  notificationsSection: {
    marginBottom: 24,
  },
  notificationHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notificationHeaderActions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 12,
  },
  notificationBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  notificationBadgeText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  clearAllButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
  },
  noAlertsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  noAlertsText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#10B981",
    marginBottom: 8,
    textAlign: "center",
  },
  noAlertsSubtext: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  alertCard: {
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
  alertCardCritical: {
    borderRightWidth: 4,
    borderRightColor: "#EF4444",
  },
  alertCardWarning: {
    borderRightWidth: 4,
    borderRightColor: "#F59E0B",
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  alertContent: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
  },
  alertActions: {
    alignItems: "flex-start",
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  alertName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
    marginBottom: 2,
  },
  alertDetails: {
    fontSize: 13,
    color: "#718096",
  },
  alertBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  handleButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  handleButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  systemSection: {
    marginBottom: 24,
  },
  systemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  systemCardHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  systemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  systemCardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  systemMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  metricLabel: {
    fontSize: 14,
    color: "#718096",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
});
