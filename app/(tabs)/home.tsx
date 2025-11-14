import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, Animated, TextInput, Modal, InputAccessoryView, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Droplets, ChevronLeft, CupSoda, X, Plus, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@/constants/colors";
import { useHomeData } from "@/lib/useHomeData";
import { useMemo, useRef, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { formatDate, isRTL } from "@/lib/utils";
import { useWorkoutLogs } from "@/lib/useWorkoutLogs";
import { ProgressRingChart } from "@/components/charts/progress-ring-chart";
import { MacroPopover } from "@/components/MacroPopover";

import { createLogger } from '@/lib/logger';

const logger = createLogger('Home');



export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const { profile, dailyLog, isLoading, isFetching, updateWater, goals, intake } = useHomeData(selectedDate);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === "admin";
  
  const { 
    strengthLogs, 
    cardioLogs, 
    totalStrengthWorkouts, 
    totalCardioMinutes,
    addWorkoutLog,
    deleteWorkoutLog,
    isAddingLog
  } = useWorkoutLogs();
  
  const [showStrengthSheet, setShowStrengthSheet] = useState<boolean>(false);
  const [showCardioSheet, setShowCardioSheet] = useState<boolean>(false);
  const [workoutAmount, setWorkoutAmount] = useState<string>("");
  const [workoutDate, setWorkoutDate] = useState<string>(formatDate(new Date()));
  
  const workoutWeekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days.reverse(); // RTL: Sunday on right, Saturday on left
  }, []);

  const macroAnimations = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const macroGlows = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const prevValues = useRef<number[]>([0, 0, 0, 0, 0]);

  const firstName = useMemo(() => {
    if (!profile?.name) return "משתמש";
    return profile.name.split(" ")[0];
  }, [profile?.name]);

  const hebrewDate = useMemo(() => {
    if (!selectedDate) return "";
    const date = new Date(selectedDate);
    if (isNaN(date.getTime())) return "";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Intl.DateTimeFormat("he-IL", options).format(date);
  }, [selectedDate]);

  const [currentWeekOffset] = useState<number>(0);
  
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (currentWeekOffset * 7));
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days.reverse(); // RTL: Sunday on right, Saturday on left
  }, [currentWeekOffset]);
  
  const isDayDisabled = (date: Date) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < sevenDaysAgo;
  };

  const hebrewDayNames = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  const consumedCalories = Math.round(intake.calories || 0);
  const goalCalories = Math.round(goals.calories || 0);
  const remainingCalories = Math.max(0, goalCalories - consumedCalories);
  const calorieProgress = goalCalories > 0 ? Math.min(consumedCalories / goalCalories, 1) : 0;

  logger.info('[HomeScreen] Calorie Data:', {
    consumed: consumedCalories,
    goal: goalCalories,
    remaining: remainingCalories,
    progress: calorieProgress,
    dailyLogKcal: dailyLog?.total_kcal,
    intakeCalories: intake.calories,
  });

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const macros = useMemo(
    () => [
      {
        name: "שומן",
        value: dailyLog?.total_fat_units || 0,
        goal: goals.fat,
        color: colors.fat,
        iconOutline: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp",
        bgWhite: false,
      },
      {
        name: "פחמימות",
        value: dailyLog?.total_carb_units || 0,
        goal: goals.carb,
        color: colors.carb,
        iconOutline: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp",
        bgWhite: false,
      },
      {
        name: "חלבון",
        value: dailyLog?.total_protein_units || 0,
        goal: goals.protein,
        color: colors.protein,
        iconOutline: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp",
        bgWhite: false,
      },
      {
        name: "פירות",
        value: dailyLog?.total_fruit_units || 0,
        goal: goals.fruit,
        color: colors.fruit,
        iconOutline: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp",
        bgWhite: false,
      },
      {
        name: "ירקות",
        value: dailyLog?.total_veg_units || 0,
        goal: goals.veg,
        color: "#D2691E",
        iconOutline: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp",
        bgWhite: false,
      },
    ],
    [dailyLog, goals]
  );

  useEffect(() => {
    macros.forEach((macro, index) => {
      if (prevValues.current[index] !== macro.value && prevValues.current[index] !== 0) {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(macroAnimations[index], {
              toValue: 1.15,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(macroAnimations[index], {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(macroGlows[index], {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(macroGlows[index], {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }),
          ]),
        ]).start();
      }
      prevValues.current[index] = macro.value;
    });
  }, [macros, macroAnimations, macroGlows]);

  const waterGlasses = dailyLog?.water_glasses || 0;

  const handleCupToggle = (cupIndex: number) => {
    if (cupIndex === waterGlasses) {
      updateWater(waterGlasses + 1);
    }
  };

  if (isLoading || !profile || !dailyLog) {
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
      {isFetching && (
        <View style={styles.fetchingOverlay}>
          <View style={styles.fetchingIndicator}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      )}
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isAdmin ? (
          <TouchableOpacity
            style={styles.greetingCard}
            activeOpacity={0.8}
            onPress={() => router.push("/admin-dashboard")}
          >
            {Platform.OS === "web" ? (
              <View style={styles.greetingGlassEffect} />
            ) : (
              <BlurView intensity={100} tint="dark" style={styles.greetingGlassEffect} />
            )}

            <View style={styles.greetingHeader}>
              {/* FIRST in JSX = appears on RIGHT ✅ */}
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingText}>ניהול לקוחות</Text>
              </View>
              
              {/* SECOND in JSX = appears on LEFT ✅ */}
              <View style={styles.adminArrow}>
                <ChevronLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.greetingCard}>
            {Platform.OS === "web" ? (
              <View style={styles.greetingGlassEffect} />
            ) : (
              <BlurView intensity={100} tint="dark" style={styles.greetingGlassEffect} />
            )}

            <View style={styles.greetingHeader}>
              {/* FIRST in JSX = appears on RIGHT ✅ */}
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingText}>היי {firstName}</Text>
                <Text style={styles.dateText}>{hebrewDate}</Text>
              </View>
              
              {/* SECOND in JSX = appears on LEFT ✅ */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mainKpiCard}>
          <View style={styles.calendarStripMain}>
            <View style={styles.weekStripContainer}>
              {weekDays.map((date, index) => {
                const dateStr = formatDate(date);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === formatDate(new Date());
                const dayOfWeek = date.getDay();
                const disabled = isDayDisabled(date);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.weekStripDay,
                      isSelected && styles.weekStripDaySelected,
                      disabled && styles.dayButtonDisabled,
                    ]}
                    onPress={() => !disabled && setSelectedDate(dateStr)}
                    activeOpacity={disabled ? 1 : 0.7}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.weekStripDayName,
                      isSelected && styles.weekStripDayNameSelected,
                      disabled && styles.dayNameDisabled,
                    ]}>
                      {hebrewDayNames[dayOfWeek]}
                    </Text>
                    <Text style={[
                      styles.weekStripDayNumber,
                      isSelected && styles.weekStripDayNumberSelected,
                      disabled && styles.dayNumberDisabled,
                    ]}>
                      {date.getDate()}
                    </Text>
                    {isToday && !isSelected && <View style={styles.weekStripTodayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.calorieBlackCard}>
            {Platform.OS === "web" ? (
              <View style={styles.calorieGlassEffect} />
            ) : (
              <BlurView intensity={100} tint="dark" style={styles.calorieGlassEffect} />
            )}
            <View style={[styles.calorieGaugeContainer, { zIndex: 1 }]}>
              {(() => {
                const size = 280;
                const radius = size / 2 - 20;
                const circumference = Math.PI * radius;
                const strokeDashoffset = circumference - (circumference * Math.min(1, Math.max(0, calorieProgress)));
                
                return (
                  <Svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                    <Path
                      d={`M 20 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
                      stroke="#212121"
                      strokeWidth={20}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={0}
                    />
                    <Path
                      d={`M 20 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
                      stroke={consumedCalories > goalCalories ? "#FF6B6B" : "#70eeff"}
                      strokeWidth={20}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </Svg>
                );
              })()}
              <View style={styles.calorieTextOverlay}>
                <Text style={styles.calorieGoalTextLight}>{goalCalories}</Text>
                <Text style={styles.calorieSubTextLight}>קלוריות</Text>
              </View>
            </View>

            <View style={[styles.calorieLabels, { zIndex: 1 }]}>
              <View style={styles.calorieLabelColumn}>
                <Text style={styles.calorieLabelTitleLight}>צרכת:</Text>
                <Text style={styles.calorieLabelValueLight}>{consumedCalories} קק״ל</Text>
              </View>
              <View style={styles.calorieLabelColumn}>
                <Text style={styles.calorieLabelTitleLight}>נשאר לך:</Text>
                <Text style={styles.calorieLabelValueLight}>{remainingCalories} קק״ל</Text>
              </View>
            </View>
          </View>

          <View style={styles.macroRingsContainer}>
            <View style={styles.macroRingsRowTop}>
              {[macros[0], macros[1], macros[2]].map((macro, index) => {
                const progress = macro.goal > 0 ? Math.min((macro.value / macro.goal) * 100, 100) : 0;
                const glowOpacity = macroGlows[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                });
                
                const lighterColor = macro.color + '88';
                
                const macroTypeMap: { [key: number]: 'fat' | 'carb' | 'protein' } = {
                  0: 'fat',
                  1: 'carb',
                  2: 'protein',
                };
                
                return (
                  <MacroPopover
                    key={index}
                    macroName={macro.name}
                    macroType={macroTypeMap[index]}
                    macroColor={macro.color}
                    selectedDate={selectedDate}
                  >
                    <Animated.View
                      style={[
                        styles.macroRingContainer,
                        {
                          transform: [{ scale: macroAnimations[index] }],
                          shadowColor: macro.color,
                          shadowOpacity: glowOpacity,
                          shadowRadius: 20,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                    >
                      <ProgressRingChart
                        progress={progress}
                        size={80}
                        strokeWidth={8}
                        color={macro.color}
                        gradientColors={[macro.color, lighterColor]}
                        config={{
                          animated: true,
                          duration: 2000,
                          gradient: true,
                        }}
                        centerContent={
                          <Image
                            source={{ uri: macro.iconOutline }}
                            style={styles.macroIcon}
                            resizeMode="contain"
                          />
                        }
                      />
                      <Text style={styles.macroLabel}>
                        <Text style={styles.macroLabelValue}>{formatUnit(macro.value)}</Text>
                        <Text style={styles.macroLabelGoal}>/{formatUnit(macro.goal)}</Text>
                      </Text>
                    </Animated.View>
                  </MacroPopover>
                );
              })}
            </View>
            <View style={styles.macroRingsRowBottom}>
              {[macros[3], macros[4]].map((macro, index) => {
                const progress = macro.goal > 0 ? Math.min((macro.value / macro.goal) * 100, 100) : 0;
                const actualIndex = index + 3;
                const glowOpacity = macroGlows[actualIndex].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                });
                
                const lighterColor = macro.color + '88';
                
                const macroTypeMap: { [key: number]: 'fruit' | 'veg' } = {
                  0: 'fruit',
                  1: 'veg',
                };
                
                return (
                  <MacroPopover
                    key={index}
                    macroName={macro.name}
                    macroType={macroTypeMap[index]}
                    macroColor={macro.color}
                    selectedDate={selectedDate}
                  >
                    <Animated.View
                      style={[
                        styles.macroRingContainer,
                        {
                          transform: [{ scale: macroAnimations[actualIndex] }],
                          shadowColor: macro.color,
                          shadowOpacity: glowOpacity,
                          shadowRadius: 20,
                          shadowOffset: { width: 0, height: 0 },
                        },
                      ]}
                    >
                      <ProgressRingChart
                        progress={progress}
                        size={80}
                        strokeWidth={8}
                        color={macro.color}
                        gradientColors={[macro.color, lighterColor]}
                        config={{
                          animated: true,
                          duration: 2000,
                          gradient: true,
                        }}
                        centerContent={
                          <Image
                            source={{ uri: macro.iconOutline }}
                            style={styles.macroIcon}
                            resizeMode="contain"
                          />
                        }
                      />
                      <Text style={styles.macroLabel}>
                        <Text style={styles.macroLabelValue}>{formatUnit(macro.value)}</Text>
                        <Text style={styles.macroLabelGoal}>/{formatUnit(macro.goal)}</Text>
                      </Text>
                    </Animated.View>
                  </MacroPopover>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterSubtitle}>12 כוסות מים ביום</Text>
            <View style={styles.waterHeaderRight}>
              <Droplets color="#3FCDD1" size={24} strokeWidth={2.5} />
              <Text style={styles.waterTitle}>מים</Text>
            </View>
          </View>
          
          <View style={styles.waterCupsContainer}>
            <View style={styles.waterCupsRow}>
              {Array.from({ length: 6 }, (_, i) => {
                const cupIndex = 5 - i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.waterCupButton}
                    onPress={() => handleCupToggle(cupIndex)}
                    activeOpacity={0.7}
                  >
                    <CupSoda
                      size={40}
                      color={cupIndex < waterGlasses ? "#3FCDD1" : "#9CA3AF"}
                      strokeWidth={2}
                      fill={cupIndex < waterGlasses ? "#3FCDD1" : "transparent"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.waterCupsRow}>
              {Array.from({ length: 6 }, (_, i) => {
                const cupIndex = 11 - i;
                return (
                  <TouchableOpacity
                    key={i + 6}
                    style={styles.waterCupButton}
                    onPress={() => handleCupToggle(cupIndex)}
                    activeOpacity={0.7}
                  >
                    <CupSoda
                      size={40}
                      color={cupIndex < waterGlasses ? "#3FCDD1" : "#9CA3AF"}
                      strokeWidth={2}
                      fill={cupIndex < waterGlasses ? "#3FCDD1" : "transparent"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.activitySection}>
          <TouchableOpacity 
            style={styles.activityCard}
            activeOpacity={0.7}
            onPress={() => setShowCardioSheet(true)}
          >
            {Platform.OS === "web" ? (
              <View style={styles.activityGlassEffect}>
                <View style={styles.activityBackdropBlur} />
              </View>
            ) : (
              <GlassView glassEffectStyle="regular" style={styles.activityGlassEffect} />
            )}
            
            <View style={styles.circularProgressContainer}>
              {(() => {
                const progress = Math.min(totalCardioMinutes / (profile?.weekly_cardio_minutes || 1), 1);
                const size = 120;
                const radius = (size - 16) / 2;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (progress * circumference);
                
                return (
                  <Svg width={size} height={size}>
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="rgba(255, 107, 107, 0.2)"
                      strokeWidth={16}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="#FF6B6B"
                      strokeWidth={16}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      rotation="-90"
                      {...(Platform.OS === 'web' ? { transformOrigin: `${size / 2} ${size / 2}` } : { origin: `${size / 2}, ${size / 2}` })}
                    />
                  </Svg>
                );
              })()}
              <View style={styles.circularProgressIcon}>
                <Image
                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762355479/treadmill_8_ikxtks.webp" }}
                  style={styles.circularIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            <Text style={styles.activityValue}>
              {totalCardioMinutes}/{profile?.weekly_cardio_minutes || 0}
            </Text>
            <Text style={styles.activityLabel}>דקות אירובי בשבוע</Text>
            
            {cardioLogs.length > 0 && (
              <View style={styles.logsListContainer}>
                {cardioLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <TouchableOpacity 
                      onPress={() => deleteWorkoutLog(log.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={12} color="#FF6B6B" />
                    </TouchableOpacity>
                    <Text style={styles.logText}>
                      {new Date(log.log_date).toLocaleDateString('he-IL')} - {log.amount} דקות
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.activityCard}
            activeOpacity={0.7}
            onPress={() => setShowStrengthSheet(true)}
          >
            {Platform.OS === "web" ? (
              <View style={styles.activityGlassEffect}>
                <View style={styles.activityBackdropBlur} />
              </View>
            ) : (
              <GlassView glassEffectStyle="regular" style={styles.activityGlassEffect} />
            )}
            
            <View style={styles.circularProgressContainer}>
              {(() => {
                const progress = Math.min(totalStrengthWorkouts / (profile?.weekly_strength_workouts || 1), 1);
                const size = 120;
                const radius = (size - 16) / 2;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (progress * circumference);
                
                return (
                  <Svg width={size} height={size}>
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="rgba(68, 177, 181, 0.2)"
                      strokeWidth={16}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="#44B1B5"
                      strokeWidth={16}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      rotation="-90"
                      {...(Platform.OS === 'web' ? { transformOrigin: `${size / 2} ${size / 2}` } : { origin: `${size / 2}, ${size / 2}` })}
                    />
                  </Svg>
                );
              })()}
              <View style={styles.circularProgressIcon}>
                <Image
                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762354881/dumbbell-weightlifting_1_e7zyth.webp" }}
                  style={styles.circularIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            <Text style={styles.activityValue}>
              {totalStrengthWorkouts}/{profile?.weekly_strength_workouts || 0}
            </Text>
            <Text style={styles.activityLabel}>אימוני כוח בשבוע</Text>
            
            {strengthLogs.length > 0 && (
              <View style={styles.logsListContainer}>
                {strengthLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <TouchableOpacity 
                      onPress={() => deleteWorkoutLog(log.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={12} color="#4ECDC4" />
                    </TouchableOpacity>
                    <Text style={styles.logText}>
                      {new Date(log.log_date).toLocaleDateString('he-IL')} - {log.amount} אימונים
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <Modal
          visible={showStrengthSheet}
          transparent
          animationType="slide"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowStrengthSheet(false);
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setShowStrengthSheet(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}
                >
                  <View style={styles.sheetHandle} />

                  <View style={styles.sheetHeader}>
                    <TouchableOpacity onPress={() => {
                      Keyboard.dismiss();
                      setShowStrengthSheet(false);
                    }}>
                      <X size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.sheetTitle}>רישום אימון כוח</Text>
                    <View style={{ width: 24 }} />
                  </View>

                  <View style={styles.sheetContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>תאריך</Text>
                  <View style={styles.weekStripContainer}>
                    {workoutWeekDays.map((date, index) => {
                      const dateStr = formatDate(date);
                      const isSelected = dateStr === workoutDate;
                      const isToday = dateStr === formatDate(new Date());
                      const dayOfWeek = date.getDay();
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.weekStripDay,
                            isSelected && styles.weekStripDaySelected,
                          ]}
                          onPress={() => setWorkoutDate(dateStr)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.weekStripDayName,
                            isSelected && styles.weekStripDayNameSelected,
                          ]}>
                            {hebrewDayNames[dayOfWeek]}
                          </Text>
                          <Text style={[
                            styles.weekStripDayNumber,
                            isSelected && styles.weekStripDayNumberSelected,
                          ]}>
                            {date.getDate()}
                          </Text>
                          {isToday && !isSelected && <View style={styles.weekStripTodayDot} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>מספר אימונים</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutAmount}
                    onChangeText={setWorkoutAmount}
                    keyboardType="numeric"
                    placeholder="הזן מספר"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID="strengthWorkoutDone"
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.addButton, isAddingLog && styles.addButtonDisabled]}
                  onPress={() => {
                    if (workoutAmount && !isAddingLog) {
                      Keyboard.dismiss();
                      addWorkoutLog({
                        workoutType: 'strength',
                        amount: Number(workoutAmount),
                        date: workoutDate,
                      });
                      setWorkoutAmount("");
                      setWorkoutDate(formatDate(new Date()));
                      setShowStrengthSheet(false);
                    }
                  }}
                  disabled={isAddingLog}
                >
                  <Plus size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>
                    {isAddingLog ? "מוסיף..." : "הוסף"}
                  </Text>
                </TouchableOpacity>
              </View>
              
                  {Platform.OS === 'ios' && (
                    <InputAccessoryView nativeID="strengthWorkoutDone">
                      <View style={styles.keyboardAccessory}>
                        <TouchableOpacity
                          style={styles.keyboardDoneButton}
                          onPress={() => Keyboard.dismiss()}
                        >
                          <Text style={styles.keyboardDoneText}>סיים</Text>
                        </TouchableOpacity>
                      </View>
                    </InputAccessoryView>
                  )}
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        <Modal
          visible={showCardioSheet}
          transparent
          animationType="slide"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowCardioSheet(false);
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setShowCardioSheet(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}
                >
                  <View style={styles.sheetHandle} />

                  <View style={styles.sheetHeader}>
                    <TouchableOpacity onPress={() => {
                      Keyboard.dismiss();
                      setShowCardioSheet(false);
                    }}>
                      <X size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.sheetTitle}>רישום אירובי</Text>
                    <View style={{ width: 24 }} />
                  </View>

                  <View style={styles.sheetContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>תאריך</Text>
                  <View style={styles.weekStripContainer}>
                    {workoutWeekDays.map((date, index) => {
                      const dateStr = formatDate(date);
                      const isSelected = dateStr === workoutDate;
                      const isToday = dateStr === formatDate(new Date());
                      const dayOfWeek = date.getDay();
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.weekStripDay,
                            isSelected && styles.weekStripDaySelected,
                          ]}
                          onPress={() => setWorkoutDate(dateStr)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.weekStripDayName,
                            isSelected && styles.weekStripDayNameSelected,
                          ]}>
                            {hebrewDayNames[dayOfWeek]}
                          </Text>
                          <Text style={[
                            styles.weekStripDayNumber,
                            isSelected && styles.weekStripDayNumberSelected,
                          ]}>
                            {date.getDate()}
                          </Text>
                          {isToday && !isSelected && <View style={styles.weekStripTodayDot} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>דקות</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutAmount}
                    onChangeText={setWorkoutAmount}
                    keyboardType="numeric"
                    placeholder="הזן מספר דקות"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={() => Keyboard.dismiss()}
                    inputAccessoryViewID="cardioWorkoutDone"
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.addButton, isAddingLog && styles.addButtonDisabled]}
                  onPress={() => {
                    if (workoutAmount && !isAddingLog) {
                      Keyboard.dismiss();
                      addWorkoutLog({
                        workoutType: 'cardio',
                        amount: Number(workoutAmount),
                        date: workoutDate,
                      });
                      setWorkoutAmount("");
                      setWorkoutDate(formatDate(new Date()));
                      setShowCardioSheet(false);
                    }
                  }}
                  disabled={isAddingLog}
                >
                  <Plus size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>
                    {isAddingLog ? "מוסיף..." : "הוסף"}
                  </Text>
                </TouchableOpacity>
              </View>
              
                  {Platform.OS === 'ios' && (
                    <InputAccessoryView nativeID="cardioWorkoutDone">
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
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  greetingCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative" as const,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    shadowColor: "rgba(13, 10, 44, 0.06)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  greetingGlassEffect: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 0,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },

  greetingHeader: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: isRTL ? "right" : "left",
  },
  dateText: {
    fontSize: 14,
    color: "#718096",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
  },
  adminArrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  mainKpiCard: {
    borderRadius: 24,
    padding: 30,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative" as const,
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    shadowColor: "rgba(13, 10, 44, 0.06)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },

  glassEffect: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 0,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  shimmerLayer: {
    position: "absolute" as const,
    top: -20,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ rotate: "-35deg" }],
  },
  liquidLayer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  kpiHeader: {
    alignItems: "flex-end",
    marginBottom: 16,
    zIndex: 1,
  },
  kpiHeaderText: {
    fontSize: 12,
    color: "#666",
  },
  calorieBlackCard: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    zIndex: 1,
    overflow: "hidden",
    position: "relative" as const,
  },
  calorieGlassEffect: {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 20,
  overflow: "hidden",
  zIndex: 0,
  backgroundColor: Platform.OS === "web" ? "rgba(20, 20, 20, 0.7)" : "rgba(20, 20, 20, 0.65)",
},
  calorieGaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative" as const,
  },
  calorieTextOverlay: {
    position: "absolute" as const,
    bottom: 30,
    alignItems: "center",
  },
  calorieGoalText: {
    fontSize: 34,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  calorieGoalTextLight: {
    fontSize: 34,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  calorieSubText: {
    fontSize: 16,
    color: "#718096",
  },
  calorieSubTextLight: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  calorieLabels: {
    flexDirection: isRTL ? "row-reverse" : "row",
    justifyContent: "space-around",
    zIndex: 1,
  },
  calorieLabelColumn: {
    alignItems: "center",
  },
  calorieLabelTitleLight: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  calorieLabelValueLight: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  calorieLabelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  calorieLabelTextLight: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  macroRingsContainer: {
    gap: 8,
    zIndex: 1,
  },
  macroRingsRowTop: {
    flexDirection: isRTL ? "row-reverse" : "row",
    justifyContent: "space-evenly",
    marginBottom: 4,
  },
  macroRingsRowBottom: {
    flexDirection: isRTL ? "row-reverse" : "row",
    justifyContent: "center",
    gap: 50,
  },
  macroRingContainer: {
    alignItems: "center",
  },
  macroRing: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative" as const,
  },
  svgProgress: {
    position: "absolute" as const,
  },
  macroIconContainer: {
    position: "absolute" as const,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  macroRingBackground: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  macroRingForeground: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  macroRingCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  macroRingCenterDark: {
    backgroundColor: "#000000",
  },
  macroRingValue: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  macroIcon: {
    width: 30,
    height: 30,
  },
  macroLabel: {
    fontSize: 11,
    color: "#2d3748",
  },
  macroLabelValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  macroLabelGoal: {
    fontSize: 11,
    color: "#718096",
  },
  waterCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  waterHeader: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  waterHeaderRight: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 6,
  },
  waterTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  waterSubtitle: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "600" as const,
  },
  waterCupsContainer: {
    gap: 12,
  },
  waterCupsRow: {
    flexDirection: isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    gap: 8,
  },
  waterCupButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },

  activitySection: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: "visible",
    position: "relative" as const,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  activityGlassEffect: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 0,
    backgroundColor: "transparent",
  },
  activityBackdropBlur: {
    position: "absolute" as const,
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      web: {
        filter: "blur(0px)",
      } as any,
    }),
  },
  activityIcon: {
    width: 60,
    height: 60,
    marginBottom: 12,
    zIndex: 1,
  },
  activityValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
    zIndex: 1,
  },
  activityLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600" as const,
    textAlign: "center",
    zIndex: 1,
  },
  calendarStripMain: {
    marginBottom: 20,
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayNameDisabled: {
    color: "#D1D5DB",
  },
  dayNumberDisabled: {
    color: "#D1D5DB",
  },
  circularProgressContainer: {
    position: "relative" as const,
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 1,
  },
  circularProgressIcon: {
    position: "absolute" as const,
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  circularIcon: {
    width: 50,
    height: 50,
  },
  progressBarContainer: {
    position: "absolute" as const,
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  logsListContainer: {
    marginTop: 12,
    width: "100%",
    paddingHorizontal: 8,
    gap: 6,
    zIndex: 1,
  },
  logItem: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    gap: 8,
  },
  logText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600" as const,
    flex: 1,
    textAlign: isRTL ? "right" : "left",
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  modalBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1001,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000",
  },
  sheetContent: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
    textAlign: isRTL ? "right" : "left",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: isRTL ? "right" : "left",
    backgroundColor: "#F9FAFB",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: isRTL ? "right" : "left",
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  addButton: {
    backgroundColor: "#3FCDD1",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  dateButtonsContainer: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  dateButtonSelected: {
    backgroundColor: "#3FCDD1",
    borderColor: "#3FCDD1",
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  dateButtonTextSelected: {
    color: "#FFFFFF",
  },
  selectedDateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  weekStripContent: {
    paddingHorizontal: 4,
  },
  weekStripContainer: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: 4,
    justifyContent: "space-between",
  },
  weekStripDay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 45,
    position: "relative" as const,
  },
  weekStripDaySelected: {
    backgroundColor: "#3FCDD1",
    borderColor: "#3FCDD1",
  },
  weekStripDayName: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 4,
  },
  weekStripDayNameSelected: {
    color: "#FFFFFF",
  },
  weekStripDayNumber: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  weekStripDayNumberSelected: {
    color: "#FFFFFF",
  },
  weekStripTodayDot: {
    position: "absolute" as const,
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3FCDD1",
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
    backgroundColor: "#3FCDD1",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  keyboardDoneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400" as const,
  },
  fetchingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  fetchingIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});