import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Platform,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pencil, TrendingUp, Ruler, BookOpen, LogOut, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/auth";
import { isRTL } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createLogger } from '@/lib/logger';

const logger = createLogger('Profile');

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const editSlideAnim = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirm, setEditPasswordConfirm] = useState("");
  
  const userName = user?.name || "משתמש";
  const userGoal = user?.kcal_goal || 1240;
  
  const targets = [
    { 
      name: "חלבון", 
      value: user?.protein_units || 0, 
      color: colors.protein,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984876/steak_6_ahllay.webp"
    },
    { 
      name: "פחמימה", 
      value: user?.carb_units || 0, 
      color: colors.carb,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984847/bread-slice_3_pvs0tu.webp"
    },
    { 
      name: "שומן", 
      value: user?.fat_units || 0, 
      color: colors.fat,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_5_joifcx.webp"
    },
    { 
      name: "ירק", 
      value: user?.veg_units || 0, 
      color: colors.vegetable,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762181616/broccoli_1_enipsf.png"
    },
    { 
      name: "פרי", 
      value: user?.fruit_units || 0, 
      color: colors.fruit,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762181534/apple-whole_mcdgtz.png"
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      logger.error("Logout error:", error);
    }
  };

  const openCalendar = () => {
    setShowCalendarModal(true);
  };

  const closeCalendar = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCalendarModal(false);
    });
  };

  useEffect(() => {
    if (showCalendarModal) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [showCalendarModal]);

  useEffect(() => {
    if (showEditSheet) {
      setEditName(user?.name || "");
      setEditEmail(user?.email || "");
      setEditPassword("");
      setEditPasswordConfirm("");
      
      Animated.spring(editSlideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [showEditSheet, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; password?: string }) => {
      logger.info("[ProfileEdit] Updating profile:", { ...data, password: data.password ? "***" : undefined });
      
      if (data.name) {
        const { error: nameError } = await supabase
          .from("profiles")
          .update({ name: data.name })
          .eq("user_id", user?.user_id);
        
        if (nameError) throw nameError;
      }
      
      if (data.email && data.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        
        if (emailError) throw emailError;
      }
      
      if (data.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
        });
        
        if (passwordError) throw passwordError;
      }
      
      return data;
    },
    onSuccess: () => {
      logger.info("[ProfileEdit] Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      closeEditSheet();
      Alert.alert("הצלחה", "הפרופיל עודכן בהצלחה");
    },
    onError: (error: any) => {
      logger.error("[ProfileEdit] Error updating profile:", error);
      Alert.alert("שגיאה", error.message || "אירעה שגיאה בעדכון הפרופיל");
    },
  });

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert("שגיאה", "אנא הזן שם");
      return;
    }
    
    if (!editEmail.trim()) {
      Alert.alert("שגיאה", "אנא הזן אימייל");
      return;
    }
    
    if (editPassword && editPassword !== editPasswordConfirm) {
      Alert.alert("שגיאה", "הסיסמאות אינן תואמות");
      return;
    }
    
    if (editPassword && editPassword.length < 6) {
      Alert.alert("שגיאה", "הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    Keyboard.dismiss();
    
    const updates: { name?: string; email?: string; password?: string } = {};
    
    if (editName !== user?.name) {
      updates.name = editName;
    }
    
    if (editEmail !== user?.email) {
      updates.email = editEmail;
    }
    
    if (editPassword) {
      updates.password = editPassword;
    }
    
    if (Object.keys(updates).length === 0) {
      closeEditSheet();
      return;
    }
    
    updateProfileMutation.mutate(updates);
  };

  const closeEditSheet = () => {
    Keyboard.dismiss();
    Animated.timing(editSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowEditSheet(false);
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#5ce1e6", "#5ce1e6", "#ffffff"]}
          locations={[0, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5ce1e6", "#5ce1e6", "#ffffff"]}
        locations={[0, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => setShowEditSheet(true)}
              activeOpacity={0.7}
            >
              <Pencil color={colors.white} size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <View style={styles.targetsCard}>
          <Text style={styles.cardTitle}>היעדים שלי</Text>
          <View style={styles.calorieGoal}>
            <Text style={styles.goalValue}>{userGoal}</Text>
            <Text style={styles.goalLabel}>יעד קלוריות יומי</Text>
          </View>
          
          <View style={styles.macroTargets}>
            {targets.map((target, index) => (
              <View key={index} style={styles.macroTarget}>
                <Image 
                  source={{ uri: target.icon }} 
                  style={styles.macroIcon}
                  resizeMode="contain"
                />
                <Text style={styles.macroText}>
                  {target.value} מנות {target.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={openCalendar}>
            <TrendingUp color="#0A8A8E" size={32} />
            <Text style={styles.actionText}>פגישות</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/measurements")}>
            <Ruler color="#0A8A8E" size={32} />
            <Text style={styles.actionText}>מדידות</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/guides")}>
            <BookOpen color="#0A8A8E" size={32} />
            <Text style={styles.actionText}>מדריכים</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={colors.white} size={20} />
          <Text style={styles.logoutText}>התנתק</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={closeCalendar}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeCalendar}
          />
          <Animated.View
            style={[
              styles.calendarSheet,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>קביעת פגישה</Text>
              <TouchableOpacity onPress={closeCalendar} style={styles.closeButton}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1xHY-aAq-m9TBH0MWZe12ap1AQ8BgV-How1Jzc-oYvFcbT9D2mbI21QxhUvCxnsGGMSrf5aGvZ?gv=true" }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showEditSheet}
        transparent
        animationType="fade"
        onRequestClose={closeEditSheet}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeEditSheet}
          />
          <Animated.View
            style={[
              styles.editSheet,
              {
                transform: [{
                  translateY: editSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>עריכת פרופיל</Text>
              <TouchableOpacity onPress={closeEditSheet} style={styles.closeButton}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.editContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.editInputGroup}>
                <Text style={styles.editLabel}>שם מלא</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="הזן שם מלא"
                  textAlign={isRTL ? "right" : "left"}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editLabel}>אימייל</Text>
                <TextInput
                  style={styles.editInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="הזן אימייל"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign={isRTL ? "right" : "left"}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.editInputGroup}>
                <Text style={styles.editLabel}>סיסמה חדשה (אופציונלי)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="השאר ריק כדי לא לשנות"
                  secureTextEntry
                  textAlign={isRTL ? "right" : "left"}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editLabel}>אימות סיסמה</Text>
                <TextInput
                  style={styles.editInput}
                  value={editPasswordConfirm}
                  onChangeText={setEditPasswordConfirm}
                  placeholder="הזן סיסמה שוב"
                  secureTextEntry
                  textAlign={isRTL ? "right" : "left"}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveProfile}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  updateProfileMutation.isPending && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>
                  {updateProfileMutation.isPending ? "שומר..." : "שמור שינויים"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: colors.white,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  targetsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  calorieGoal: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  goalValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "600" as const,
  },
  macroTargets: {
    gap: 12,
  },
  macroTarget: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  macroIcon: {
    width: 40,
    height: 40,
  },
  macroText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600" as const,
    textAlign: isRTL ? "right" : "left",
  },
  quickActions: {
    flexDirection: (isRTL ? "row-reverse" : "row"),
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  actionText: {
    fontSize: 12,
    color: "#2d3748",
    fontWeight: "700" as const,
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: (isRTL ? "row-reverse" : "row"),
    backgroundColor: colors.brown,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  calendarSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  editSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  editContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  editInputGroup: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: isRTL ? "right" : "left",
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
