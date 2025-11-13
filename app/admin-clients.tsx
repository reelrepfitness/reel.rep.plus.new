import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, TextInput, Modal, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/constants/colors";
import { useMemo, useState } from "react";
import { Droplet, UserPlus, Menu, X, MessageSquare } from "lucide-react-native";
import { Image } from "expo-image";
import { AdminMenuSheet } from "@/components/AdminMenuSheet";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminClients');

export default function AdminClientsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [whatsappSheetVisible, setWhatsappSheetVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["admin-clients", user?.user_id, today],
    queryFn: async () => {
      logger.info("[AdminClients] Fetching clients and their daily logs");
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user?.user_id)
        .order("name", { ascending: true });

      if (profilesError) {
        logger.error("[AdminClients] Error fetching clients:", profilesError);
        throw profilesError;
      }

      const { data: dailyLogs, error: logsError } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("date", today);

      if (logsError) {
        logger.error("[AdminClients] Error fetching daily logs:", logsError);
        throw logsError;
      }

      logger.info("[AdminClients] Clients fetched:", profiles?.length, "Daily logs:", dailyLogs?.length);
      
      return {
        profiles: profiles as User[],
        dailyLogs: dailyLogs || [],
      };
    },
    enabled: user?.role === "admin",
    refetchInterval: 60000,
  });

  const clients = useMemo(() => clientsData?.profiles || [], [clientsData?.profiles]);
  const dailyLogs = useMemo(() => clientsData?.dailyLogs || [], [clientsData?.dailyLogs]);

  const clientsWithProgress = useMemo(() => {
    return clients.map((client) => {
      const log = dailyLogs.find((l: any) => l.user_id === client.user_id);
      return {
        ...client,
        todayLog: log || null,
      };
    });
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
            title: "לקוחות",
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
            title: "לקוחות",
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
          title: "לקוחות",
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
          <Text style={styles.title}>רשימת לקוחות</Text>
          <Text style={styles.subtitle}>{clients.length} לקוחות במערכת</Text>
        </View>

        <TouchableOpacity
          style={styles.addClientButton}
          onPress={() => router.push("/admin-add-client")}
          activeOpacity={0.8}
        >
          <UserPlus color="#FFFFFF" size={24} />
          <Text style={styles.addClientButtonText}>הוסף ליווי חדש</Text>
        </TouchableOpacity>

        <View style={styles.clientsGrid}>
          {clientsWithProgress.length > 0 ? (
            clientsWithProgress.map((client) => {
              const log = client.todayLog as any;
              const calorieProgress = client.kcal_goal && log ? Math.min((log.total_kcal / client.kcal_goal) * 100, 100) : 0;
              const proteinProgress = client.protein_units && log ? Math.min((log.total_protein_units / client.protein_units) * 100, 100) : 0;
              const carbProgress = client.carb_units && log ? Math.min((log.total_carb_units / client.carb_units) * 100, 100) : 0;
              const fatProgress = client.fat_units && log ? Math.min((log.total_fat_units / client.fat_units) * 100, 100) : 0;
              const waterCount = log?.water_glasses || 0;
              const waterGoal = client.water_daily_goal || 12;

              return (
                <TouchableOpacity 
                  key={client.user_id} 
                  style={styles.clientCard}
                  onPress={() => {
                    logger.info("[AdminClients] Navigating to user dashboard:", client.user_id, client.name);
                    router.push({
                      pathname: "/user-dashboard",
                      params: { userId: client.user_id, userName: client.name || "משתמש" },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.clientHeader}>
                    {client.whatsapp_link && (
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setWhatsappSheetVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1760615137/whatsapp_2_qkcamm.png" }}
                          style={styles.whatsappIcon}
                          contentFit="contain"
                        />
                      </TouchableOpacity>
                    )}
                    <View style={styles.clientInfo}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>
                          {client.name?.charAt(0) || "?"}
                        </Text>
                      </View>
                      <View style={styles.clientDetails}>
                        <Text style={styles.clientName}>{client.name || "ללא שם"}</Text>
                        <Text style={styles.clientEmail}>{client.email}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressBars}>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressValue}>
                          {log ? Math.round(log.total_kcal) : 0}/{client.kcal_goal || 0}
                        </Text>
                        <Text style={styles.progressLabel}>קלוריות</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${calorieProgress}%`, backgroundColor: colors.primary }]} />
                      </View>
                    </View>

                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressValue}>
                          {log ? log.total_protein_units : 0}/{client.protein_units || 0}
                        </Text>
                        <Text style={styles.progressLabel}>חלבון</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${proteinProgress}%`, backgroundColor: colors.protein }]} />
                      </View>
                    </View>

                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressValue}>
                          {log ? log.total_carb_units : 0}/{client.carb_units || 0}
                        </Text>
                        <Text style={styles.progressLabel}>פחמימות</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${carbProgress}%`, backgroundColor: colors.carb }]} />
                      </View>
                    </View>

                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressValue}>
                          {log ? log.total_fat_units : 0}/{client.fat_units || 0}
                        </Text>
                        <Text style={styles.progressLabel}>שומן</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${fatProgress}%`, backgroundColor: colors.fat }]} />
                      </View>
                    </View>

                    <View style={styles.waterProgressItem}>
                      <View style={styles.waterProgressHeader}>
                        <Text style={styles.waterProgressText}>{waterCount}/{waterGoal}</Text>
                        <View style={styles.waterProgressLabel}>
                          <Droplet color="#3FCDD1" size={16} />
                          <Text style={styles.progressLabel}>מים</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>אין לקוחות במערכת</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={whatsappSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWhatsappSheetVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWhatsappSheetVisible(false)}
        >
          <Pressable style={styles.whatsappSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>שלח הודעת וואטסאפ</Text>
              <TouchableOpacity onPress={() => setWhatsappSheetVisible(false)}>
                <X size={24} color="#2d3748" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>אל: {selectedClient?.name}</Text>

            <TextInput
              style={styles.messageInput}
              placeholder="כתוב הודעה..."
              placeholderTextColor="#9CA3AF"
              value={whatsappMessage}
              onChangeText={setWhatsappMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.sendWhatsappButton}
              onPress={() => {
                if (selectedClient?.whatsapp_link) {
                  const message = encodeURIComponent(whatsappMessage);
                  const url = selectedClient.whatsapp_link.includes('?')
                    ? `${selectedClient.whatsapp_link}&text=${message}`
                    : `${selectedClient.whatsapp_link}?text=${message}`;
                  Linking.openURL(url);
                  setWhatsappSheetVisible(false);
                  setWhatsappMessage("");
                }
              }}
              activeOpacity={0.8}
            >
              <MessageSquare size={20} color="#FFFFFF" />
              <Text style={styles.sendWhatsappButtonText}>שלח בוואטסאפ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      
      <AdminMenuSheet open={isMenuOpen} onOpenChange={setIsMenuOpen} currentScreen="clients" />
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
  clientsGrid: {
    gap: 12,
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  clientHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    flex: 1,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginStart: 12,
  },
  clientAvatarText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  clientDetails: {
    flex: 1,
    alignItems: "flex-end",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 8,
  },
  progressBars: {
    gap: 12,
  },
  progressItem: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "600" as const,
  },
  progressValue: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500" as const,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  waterProgressItem: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  waterProgressHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterProgressLabel: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 4,
  },
  waterProgressText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600" as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  addClientButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addClientButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  whatsappButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappIcon: {
    width: 36,
    height: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  whatsappSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  sheetHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 120,
    marginBottom: 16,
  },
  sendWhatsappButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sendWhatsappButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
