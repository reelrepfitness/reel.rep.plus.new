import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User } from "lucide-react-native";

// Enable RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const nameError = name && name.length < 2 ? 'השם חייב להכיל לפחות 2 תווים' : '';
  const emailError = email && !email.includes('@') ? 'נא להזין כתובת אימייל תקינה' : '';
  const passwordError = password && password.length < 6 ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : '';
  const confirmPasswordError = confirmPassword && confirmPassword !== password ? 'הסיסמאות אינן תואמות' : '';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("נא למלא את כל השדות");
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp(email.trim(), password, name.trim());
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      console.error("Register error:", err);
      const errorMessage = err instanceof Error ? err.message : "שגיאה בהרשמה";
      
      if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        setError("כתובת האימייל כבר רשומה במערכת");
      } else if (errorMessage.includes("Password should be at least")) {
        setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      } else if (errorMessage.includes("Invalid email")) {
        setError("כתובת אימייל לא תקינה");
      } else {
        setError("שגיאה בהרשמה. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5ce1e6", "#5ce1e6", "#ffffff"]}
        locations={[0, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.centerContainer}>
          <BlurView intensity={40} tint="light" style={styles.glassCard}>
            <View style={styles.whiteBlur} />
            
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: `https://rork.app/pa/b22ezxscydzxy6y59xv7e/logo` }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.textSection}>
              <Text style={styles.title}>הרשמה</Text>
              <Text style={styles.subtitle}>צור חשבון חדש</Text>
            </View>

            <View style={styles.fieldSection}>
              <Input
                placeholder="השם המלא שלך"
                icon={User}
                value={name}
                onChangeText={setName}
                error={nameError}
              />

              <Input
                placeholder="yourname@gmail.com"
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
              />

              <Input
                placeholder="סיסמה"
                icon={Lock}
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
              />

              <Input
                placeholder="אימות סיסמה"
                icon={Lock}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={confirmPasswordError}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonsSection}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0)"]} 
                  style={styles.registerButtonGradient}
                >
                  <View style={styles.registerButtonInner}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.registerButtonText}>הירשם</Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.signInSection}>
              <Text style={styles.signInText}>כבר יש לך חשבון?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signInLink}>התחבר</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
  },
  glassCard: {
    width: 343,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    gap: 20,
    overflow: "hidden" as const,
  },
  whiteBlur: {
    position: "absolute" as const,
    width: 320.5,
    height: 320.5,
    left: 192,
    top: -170.5,
    backgroundColor: "#FFFFFF",
    opacity: 0.5,
    borderRadius: 160.25,
  },
  logoContainer: {
    width: 60,
    height: 60,
    alignSelf: "center" as const,
    zIndex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  textSection: {
    gap: 12,
    alignItems: "center" as const,
    zIndex: 2,
  },
  title: {
    fontFamily: "Inter" as const,
    fontWeight: "700" as const,
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: -0.64,
    color: "#111827",
  },
  subtitle: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#6C7278",
    textAlign: "center" as const,
  },
  fieldSection: {
    gap: 14,
    zIndex: 3,
  },
  errorText: {
    color: "#FF5252",
    textAlign: "center" as const,
    fontSize: 12,
    fontWeight: "500" as const,
  },
  buttonsSection: {
    gap: 20,
    zIndex: 4,
  },
  registerButton: {
    height: 48,
    borderRadius: 10,
    overflow: "hidden" as const,
  },
  registerButtonGradient: {
    flex: 1,
  },
  registerButtonInner: {
    flex: 1,
    backgroundColor: "#1D61E7",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#253EA7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.48,
    shadowRadius: 2,
    elevation: 3,
  },
  registerButtonText: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: "#FFFFFF",
  },
  signInSection: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 6,
    zIndex: 5,
  },
  signInText: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#6C7278",
  },
  signInLink: {
    fontFamily: "Inter" as const,
    fontWeight: "600" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#4D81E7",
  },
});

export default RegisterScreen;