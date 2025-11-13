import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState, useEffect } from "react";
import { Bell, Plus, Clock, Target, TrendingUp, Save, Trash2, Send, Users, UserCheck } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { sendToUsers, sendToAllUsers } from "@/lib/sendPushNotifications";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminNotifications');

type NotificationTrigger = "time" | "goal_reached" | "goal_missed" | "inactive";

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  trigger: NotificationTrigger;
  triggerValue?: string;
  isActive: boolean;
}

export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"templates" | "create" | "send">("send");
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      title: "בוקר טוב!",
      message: "זמן לתכנן את היום התזונתי שלך 🌅",
      trigger: "time",
      triggerValue: "08:00",
      isActive: true,
    },
    {
      id: "2",
      title: "השגת יעד!",
      message: "כל הכבוד! השגת את יעד החלבון היומי 💪",
      trigger: "goal_reached",
      triggerValue: "protein",
      isActive: true,
    },
    {
      id: "3",
      title: "תזכורת מים",
      message: "זמן לשתות כוס מים 💧",
      trigger: "time",
      triggerValue: "10:00,14:00,18:00",
      isActive: true,
    },
  ]);

  const [newNotification, setNewNotification] = useState<NotificationTemplate>({
    id: Date.now().toString(),
    title: "",
    message: "",
    trigger: "time",
    triggerValue: "",
    isActive: true,
  });

  const [sendTitle, setSendTitle] = useState<string>("");
  const [sendMessage, setSendMessage] = useState<string>("");
  const [sendTo, setSendTo] = useState<"all" | "selected">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const handleToggleNotification = (id: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id ? { ...template, isActive: !template.isActive } : template
      )
    );
  };

  const handleDeleteNotification = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  useEffect(() => {
    if (activeTab === "send") {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, role")
        .eq("role", "user")
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error("Error loading users:", error);
      Alert.alert("שגיאה", "לא ניתן לטעון את רשימת המשתמשים");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotification = async () => {
    if (!sendTitle.trim() || !sendMessage.trim()) {
      Alert.alert("שגיאה", "אנא מלא את כל השדות");
      return;
    }

    if (sendTo === "selected" && selectedUsers.length === 0) {
      Alert.alert("שגיאה", "אנא בחר לפחות משתמש אחד");
      return;
    }

    try {
      setSending(true);

      let results;
      if (sendTo === "all") {
        results = await sendToAllUsers(sendTitle, sendMessage, {}, user?.user_id);
      } else {
        results = await sendToUsers(
          selectedUsers,
          sendTitle,
          sendMessage,
          {},
          user?.user_id
        );
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      let message = `נשלחו ${successCount} התראות בהצלחה`;
      if (failureCount > 0) {
        message += `\n${failureCount} התראות נכשלו`;
      }

      Alert.alert("הצלחה", message);

      setSendTitle("");
      setSendMessage("");
      setSelectedUsers([]);
    } catch (error) {
      logger.error("Error sending notifications:", error);
      Alert.alert("שגיאה", "לא ניתן לשלוח את ההתראות");
    } finally {
      setSending(false);
    }
  };

  const handleSaveNotification = () => {
    if (newNotification.title && newNotification.message) {
      setTemplates(prev => [...prev, { ...newNotification, id: Date.now().toString() }]);
      setNewNotification({
        id: Date.now().toString(),
        title: "",
        message: "",
        trigger: "time",
        triggerValue: "",
        isActive: true,
      });
      setActiveTab("templates");
    }
  };

  const getTriggerIcon = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case "time":
        return <Clock size={20} color={colors.primary} />;
      case "goal_reached":
        return <Target size={20} color="#10B981" />;
      case "goal_missed":
        return <TrendingUp size={20} color="#EF4444" />;
      case "inactive":
        return <Bell size={20} color="#F59E0B" />;
    }
  };

  const getTriggerLabel = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case "time":
        return "לפי שעה";
      case "goal_reached":
        return "השגת יעד";
      case "goal_missed":
        return "החמצת יעד";
      case "inactive":
        return "חוסר פעילות";
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
            title: "ניהול התראות",
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
          title: "ניהול התראות",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "send" && styles.tabActive]}
          onPress={() => setActiveTab("send")}
          activeOpacity={0.8}
        >
          <Send size={20} color={activeTab === "send" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "send" && styles.tabTextActive]}>
            שלח התראות
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "templates" && styles.tabActive]}
          onPress={() => setActiveTab("templates")}
          activeOpacity={0.8}
        >
          <Bell size={20} color={activeTab === "templates" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "templates" && styles.tabTextActive]}>
            תבניות
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.tabActive]}
          onPress={() => setActiveTab("create")}
          activeOpacity={0.8}
        >
          <Plus size={20} color={activeTab === "create" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
            צור חדש
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "send" ? (
          <View style={styles.sendSection}>
            <Text style={styles.sectionTitle}>שליחת התראה למשתמשים</Text>

            <View style={styles.formCard}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>כותרת</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="לדוגמה: עדכון חשוב"
                  placeholderTextColor="#9CA3AF"
                  value={sendTitle}
                  onChangeText={setSendTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>תוכן ההודעה</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="לדוגמה: זמן לעדכן את המדידות שלך"
                  placeholderTextColor="#9CA3AF"
                  value={sendMessage}
                  onChangeText={setSendMessage}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>שלח אל</Text>
                <View style={styles.recipientOptions}>
                  <TouchableOpacity
                    style={[
                      styles.recipientOption,
                      sendTo === "all" && styles.recipientOptionActive,
                    ]}
                    onPress={() => setSendTo("all")}
                    activeOpacity={0.7}
                  >
                    <Users size={20} color={sendTo === "all" ? "#FFFFFF" : colors.primary} />
                    <Text
                      style={[
                        styles.recipientOptionText,
                        sendTo === "all" && styles.recipientOptionTextActive,
                      ]}
                    >
                      כל המשתמשים
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.recipientOption,
                      sendTo === "selected" && styles.recipientOptionActive,
                    ]}
                    onPress={() => setSendTo("selected")}
                    activeOpacity={0.7}
                  >
                    <UserCheck size={20} color={sendTo === "selected" ? "#FFFFFF" : colors.primary} />
                    <Text
                      style={[
                        styles.recipientOptionText,
                        sendTo === "selected" && styles.recipientOptionTextActive,
                      ]}
                    >
                      משתמשים נבחרים
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {sendTo === "selected" && (
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    בחר משתמשים ({selectedUsers.length}/{users.length})
                  </Text>
                  {loadingUsers ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ScrollView style={styles.usersList} nestedScrollEnabled>
                      {users.map(u => (
                        <TouchableOpacity
                          key={u.user_id}
                          style={[
                            styles.userItem,
                            selectedUsers.includes(u.user_id) && styles.userItemSelected,
                          ]}
                          onPress={() => toggleUserSelection(u.user_id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.userInfo}>
                            <Text style={styles.userName}>{u.name}</Text>
                            <Text style={styles.userEmail}>{u.email}</Text>
                          </View>
                          {selectedUsers.includes(u.user_id) && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={handleSendNotification}
                activeOpacity={0.8}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>שלח התראות</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === "templates" ? (
          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>התראות אוטומטיות ({templates.length})</Text>
            
            {templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <View style={styles.templateTitleRow}>
                      {getTriggerIcon(template.trigger)}
                      <Text style={styles.templateTitle}>{template.title}</Text>
                    </View>
                    <Text style={styles.templateMessage}>{template.message}</Text>
                    <View style={styles.templateMeta}>
                      <Text style={styles.templateMetaText}>
                        {getTriggerLabel(template.trigger)}
                        {template.triggerValue && ` • ${template.triggerValue}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.templateActions}>
                    <Switch
                      value={template.isActive}
                      onValueChange={() => handleToggleNotification(template.id)}
                      trackColor={{ false: "#D1D5DB", true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNotification(template.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>מחק</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.createSection}>
            <Text style={styles.sectionTitle}>צור התראה חדשה</Text>

            <View style={styles.formCard}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>כותרת</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="לדוגמה: בוקר טוב!"
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.title}
                  onChangeText={(text) => setNewNotification({ ...newNotification, title: text })}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>תוכן ההודעה</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="לדוגמה: זמן לתכנן את היום התזונתי שלך"
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.message}
                  onChangeText={(text) => setNewNotification({ ...newNotification, message: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>סוג טריגר</Text>
                <View style={styles.triggerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "time" && styles.triggerOptionActive,
                    ]}
                    onPress={() => setNewNotification({ ...newNotification, trigger: "time" })}
                    activeOpacity={0.7}
                  >
                    <Clock size={20} color={newNotification.trigger === "time" ? "#FFFFFF" : colors.primary} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "time" && styles.triggerOptionTextActive,
                      ]}
                    >
                      לפי שעה
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "goal_reached" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "goal_reached" })
                    }
                    activeOpacity={0.7}
                  >
                    <Target size={20} color={newNotification.trigger === "goal_reached" ? "#FFFFFF" : "#10B981"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "goal_reached" && styles.triggerOptionTextActive,
                      ]}
                    >
                      השגת יעד
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "goal_missed" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "goal_missed" })
                    }
                    activeOpacity={0.7}
                  >
                    <TrendingUp size={20} color={newNotification.trigger === "goal_missed" ? "#FFFFFF" : "#EF4444"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "goal_missed" && styles.triggerOptionTextActive,
                      ]}
                    >
                      החמצת יעד
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "inactive" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "inactive" })
                    }
                    activeOpacity={0.7}
                  >
                    <Bell size={20} color={newNotification.trigger === "inactive" ? "#FFFFFF" : "#F59E0B"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "inactive" && styles.triggerOptionTextActive,
                      ]}
                    >
                      חוסר פעילות
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>ערך טריגר</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={
                    newNotification.trigger === "time"
                      ? "לדוגמה: 08:00 או 10:00,14:00,18:00"
                      : "לדוגמה: protein, carb, fat"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.triggerValue}
                  onChangeText={(text) =>
                    setNewNotification({ ...newNotification, triggerValue: text })
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNotification}
                activeOpacity={0.8}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>שמור התראה</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 16,
  },
  templatesSection: {
    paddingBottom: 24,
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  templateMessage: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
    textAlign: isRTL ? "right" : "left",
  },
  templateMeta: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 8,
  },
  templateMetaText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  templateActions: {
    justifyContent: "center",
  },
  deleteButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  createSection: {
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTextArea: {
    height: 100,
  },
  triggerOptions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    flexWrap: "wrap" as any,
    gap: 8,
  },
  triggerOption: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  triggerOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  triggerOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  triggerOptionTextActive: {
    color: "#FFFFFF",
  },
  saveButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
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
  sendSection: {
    paddingBottom: 24,
  },
  recipientOptions: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    gap: 8,
  },
  recipientOption: {
    flex: 1,
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  recipientOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  recipientOptionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  recipientOptionTextActive: {
    color: "#FFFFFF",
  },
  usersList: {
    maxHeight: 300,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  userItem: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userItemSelected: {
    backgroundColor: "#DBEAFE",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: isRTL ? "right" : "left",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  sendButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
