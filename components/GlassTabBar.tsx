import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, DynamicColorIOS, type ColorValue } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback((route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }, [navigation]);

  const handleLongPress = useCallback((route: any) => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
      <View style={styles.wrapper} pointerEvents="box-none">
        <View style={styles.backgroundContainer}>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={100} tint="extraLight" style={styles.blurOuter} />
          ) : (
            <View style={styles.blurOuterWeb} />
          )}
          <LinearGradient 
            colors={["rgba(255, 255, 255, 0.7)", "rgba(247, 247, 247, 0.5)"]} 
            style={styles.fill} 
          />
          <View style={styles.glassOverlay} />
        </View>

        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

            const dynamicColor: ColorValue = Platform.OS === 'ios' 
              ? DynamicColorIOS({ dark: 'white', light: 'black' })
              : (isFocused ? "#0088FF" : "#404040");

            const iconColor: ColorValue = Platform.OS === 'ios' 
              ? dynamicColor
              : (isFocused ? "#0088FF" : "#404040");

            const iconComponent = options.tabBarIcon?.({ 
              focused: isFocused, 
              color: iconColor as any,
              size: 24
            });

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={`tab-${route.name}`}
                onPress={() => handlePress(route, isFocused)}
                onLongPress={() => handleLongPress(route)}
                style={styles.tab}
                activeOpacity={0.7}
              >
                {isFocused && <View style={styles.tabSelectedBg} />}
                {iconComponent && (
                  <View style={styles.tabIcon}>
                    {iconComponent}
                  </View>
                )}
                <Text 
                  style={[
                    styles.tabLabel,
                    Platform.OS === 'ios' && { color: DynamicColorIOS({ dark: 'white', light: 'black' }) },
                    isFocused && styles.tabLabelActive
                  ]}
                  numberOfLines={1}
                >
                  {typeof label === 'string' ? label : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  wrapper: {
    height: 80,
    borderRadius: 30,
    overflow: "visible",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    overflow: "hidden",
  },
  blurOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  blurOuterWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 30,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
      } as any,
    }),
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    height: 60,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  tabSelectedBg: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
    backgroundColor: "#EDEDED",
    borderRadius: 20,
    zIndex: 0,
  },
  tabIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    color: Platform.OS === 'ios' ? undefined : "#404040",
    zIndex: 2,
    letterSpacing: -0.1,
    ...Platform.select({
      ios: {
        fontFamily: "System",
      },
      android: {
        fontFamily: "sans-serif-medium",
      },
    }),
  },
  tabLabelActive: {
    fontWeight: "600",
    color: Platform.OS === 'ios' ? undefined : "#0088FF",
  },
});
