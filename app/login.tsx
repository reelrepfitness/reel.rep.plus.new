import { useState, useRef, useEffect } from "react";
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
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { Mail, Lock } from "lucide-react-native";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Enable RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (showSignIn) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [showSignIn]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("שגיאה", "נא למלא את כל השדות");
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "שגיאה בהתחברות";

      if (errorMessage.includes("Invalid login") || errorMessage.includes("Invalid")) {
        Alert.alert("שגיאה", "אימייל או סיסמה שגויים");
      } else if (errorMessage.includes("Email not confirmed")) {
        Alert.alert("שגיאה", "נא לאמת את כתובת האימייל שלך");
      } else {
        Alert.alert("שגיאה", "שגיאה בהתחברות. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Gradient Background */}
      <LinearGradient
        colors={["#2FE1E4", "#1FA09B"]}
        locations={[0, 0.594]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Wave Layer 1 */}
      <Svg
        width={SCREEN_WIDTH * 1.02}
        height={SCREEN_HEIGHT * 0.79}
        viewBox="0 0 375 643"
        style={styles.wave1}
      >
        <Path
          d="M0 294.76C93.75 328.84 187.5 362.92 281.25 362.92C375 362.92 375 328.84 375 294.76V643.76H0V294.76Z"
          fill="url(#wave1Gradient)"
        />
        <Defs>
          <SvgLinearGradient id="wave1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="1.56%" stopColor="#2FE1E4" />
            <Stop offset="58.62%" stopColor="#1FA09B" />
          </SvgLinearGradient>
        </Defs>
      </Svg>

      {/* Animated Wave Layer 2 */}
      <Svg
        width={SCREEN_WIDTH * 1.014}
        height={SCREEN_HEIGHT * 0.595}
        viewBox="0 0 380 483"
        style={styles.wave2}
      >
        <Path
          d="M0 0C95 69.57 190 139.14 285 139.14C380 139.14 380 69.57 380 0V483H0V0Z"
          fill="url(#wave2Gradient)"
        />
        <Defs>
          <SvgLinearGradient id="wave2Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2FE1E4" />
            <Stop offset="57.1%" stopColor="#1FA09B" />
          </SvgLinearGradient>
        </Defs>
      </Svg>

      {/* Animated Wave Layer 3 */}
      <Svg
        width={SCREEN_WIDTH * 1.02}
        height={SCREEN_HEIGHT * 0.456}
        viewBox="0 0 375 371"
        style={styles.wave3}
      >
        <Path
          d="M0 144.68C93.75 96.45 187.5 48.23 281.25 48.23C375 48.23 375 96.45 375 144.68V371H0V144.68Z"
          fill="url(#wave3Gradient)"
        />
        <Defs>
          <SvgLinearGradient id="wave3Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="9.39%" stopColor="#2FE1E4" />
            <Stop offset="49.98%" stopColor="#1FA09B" />
          </SvgLinearGradient>
        </Defs>
      </Svg>

      {/* Animated Wave Layer 4 */}
      <Svg
        width={SCREEN_WIDTH * 1.014}
        height={SCREEN_HEIGHT * 0.325}
        viewBox="0 0 380 264"
        style={styles.wave4}
      >
        <Path
          d="M0 52.88C95 17.63 190 0 285 0C380 0 380 35.25 380 70.51V264H0V52.88Z"
          fill="url(#wave4Gradient)"
        />
        <Defs>
          <SvgLinearGradient id="wave4Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="7.53%" stopColor="#2FE1E4" />
            <Stop offset="55.23%" stopColor="#1FA09B" />
          </SvgLinearGradient>
        </Defs>
      </Svg>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1763042000/fgbfgb_1_yb61kl.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Indicator */}
      <View style={[styles.bottomIndicator, { bottom: insets.bottom + 20 }]} />

      {/* Sign In Button */}
      {!showSignIn && (
        <TouchableOpacity
          style={[styles.signInButton, { bottom: insets.bottom + 80 }]}
          onPress={() => setShowSignIn(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.signInButtonText}>כניסה</Text>
        </TouchableOpacity>
      )}

      {/* Overlay when sheet is open */}
      {showSignIn && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSignIn(false)}
        />
      )}

      {/* Sign In Sheet */}
      <Animated.View
        style={[
          styles.signInSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.sheetContent}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Title */}
            <Text style={styles.sheetTitle}>כניסה לחשבון</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="אימייל"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="סיסמה"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#2FE1E4", "#1FA09B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>כניסה</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpSection}>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signUpLink}>הירשם</Text>
              </TouchableOpacity>
              <Text style={styles.signUpText}>אין לך חשבון?</Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSignIn(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  wave1: {
    position: "absolute",
    left: -4,
    top: SCREEN_HEIGHT * 0.5148,
  },
  wave2: {
    position: "absolute",
    left: -4,
    top: SCREEN_HEIGHT * 0.6018,
  },
  wave3: {
    position: "absolute",
    left: -1,
    top: SCREEN_HEIGHT * 0.7211,
  },
  wave4: {
    position: "absolute",
    left: -4,
    top: SCREEN_HEIGHT * 0.8503,
  },
  logoContainer: {
    position: "absolute",
    width: 203,
    height: 203,
    left: (SCREEN_WIDTH - 203) / 2,
    top: SCREEN_HEIGHT * 0.177,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  bottomIndicator: {
    position: "absolute",
    width: 134,
    height: 5,
    left: "32.27%",
    backgroundColor: "#000000",
    borderRadius: 2.5,
    alignSelf: "center",
  },
  signInButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1FA09B",
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  signInSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 2,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  keyboardAvoid: {
    flex: 1,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIconContainer: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 12,
    shadowColor: "#2FE1E4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  signUpSection: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2FE1E4",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});

export default LoginScreen;