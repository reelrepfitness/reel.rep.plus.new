import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { View, ActivityIndicator } from "react-native";
import { colors } from "@/constants/colors";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}
