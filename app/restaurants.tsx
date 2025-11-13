import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Restaurant } from "@/lib/types";
import { colors } from "@/constants/colors";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Restaurants');

export default function RestaurantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const mealType = params.mealType as string | undefined;

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      logger.info("[Restaurants] Fetching all restaurants");
      
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        logger.error("[Restaurants] Error fetching:", error);
        throw error;
      }

      logger.info(`[Restaurants] Loaded ${data?.length || 0} restaurants`);
      return data as Restaurant[];
    },
  });

  const handleRestaurantPress = (restaurant: Restaurant) => {
    logger.info("[Restaurants] Selected restaurant:", restaurant.name);
    router.push({
      pathname: "/restaurant-menu",
      params: {
        restaurantId: restaurant.id.toString(),
        restaurantName: restaurant.name,
        mealType: mealType || "",
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>בחר מסעדה</Text>
          <View style={styles.spacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : restaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>אין מסעדות זמינות</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.restaurantGrid}>
              {restaurants.map((restaurant) => (
                <TouchableOpacity
                  key={restaurant.id}
                  style={styles.restaurantCard}
                  onPress={() => handleRestaurantPress(restaurant)}
                  activeOpacity={0.8}
                >
                  {restaurant.img_url ? (
                    <Image
                      source={{ uri: restaurant.img_url }}
                      style={styles.restaurantImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.restaurantImagePlaceholder}>
                      <Text style={styles.restaurantImagePlaceholderText}>
                        {restaurant.name.charAt(0)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName} numberOfLines={2}>
                      {restaurant.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F5",
  },
  header: {
    backgroundColor: "#000000",
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  restaurantGrid: {
    flexDirection: (isRTL ? "row-reverse" : "row") as const,
    flexWrap: "wrap",
    gap: 12,
  },
  restaurantCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  restaurantImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F0F0F0",
  },
  restaurantImagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantImagePlaceholderText: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "#999",
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    minHeight: 40,
  },
});
