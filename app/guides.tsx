import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ChevronLeft,
  ChevronRight,
  BookOpen, 
  Utensils, 
  Calendar, 
  Plane, 
  Activity, 
  Sun,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  XCircle,
  TrendingUp,
  Droplets,
  Coffee,
  Flame,
  Apple,
  Fish,
  Wheat,
  Candy,
  ArrowRight
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Guide } from "@/lib/types";
import { useState, ReactElement, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Guides');

export default function GuidesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const slideAnims = useRef<Animated.Value[]>([]);
  const fadeAnims = useRef<Animated.Value[]>([]);
  const [showImportantGuideModal, setShowImportantGuideModal] = useState(false);
  const [importantGuide, setImportantGuide] = useState<Guide | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: guides, isLoading, error } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching guides:", error);
        throw error;
      }

      const guidesData = data as Guide[];
      
      const importantGuideTitle = "דגשים חשובים להתנהלות היומית";
      const importantIndex = guidesData.findIndex(g => g.title.includes("דגשים") && g.title.includes("חשובים"));
      
      if (importantIndex > 0) {
        const [important] = guidesData.splice(importantIndex, 1);
        guidesData.unshift(important);
      }

      return guidesData;
    },
  });

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasAcknowledged = await AsyncStorage.getItem("important_guide_acknowledged");
        if (!hasAcknowledged && guides && guides.length > 0) {
          const important = guides.find(g => g.title.includes("דגשים") && g.title.includes("חשובים"));
          if (important) {
            setImportantGuide(important);
            setShowImportantGuideModal(true);
          }
        }
      } catch (error) {
        logger.error("Error checking first time:", error);
      }
    };

    checkFirstTime();
  }, [guides]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (guides && guides.length > 0 && !selectedGuide) {
      slideAnims.current = guides.map(() => new Animated.Value(100));
      fadeAnims.current = guides.map(() => new Animated.Value(0));

      const animations = guides.map((_, index) => {
        return Animated.parallel([
          Animated.timing(slideAnims.current[index], {
            toValue: 0,
            duration: 500,
            delay: index * 80,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnims.current[index], {
            toValue: 1,
            duration: 500,
            delay: index * 80,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(0, animations).start();
    }
  }, [guides, selectedGuide]);

  const handleBack = () => {
    if (selectedGuide) {
      setSelectedGuide(null);
    } else {
      router.back();
    }
  };

  const handleAcknowledgeImportantGuide = async () => {
    try {
      await AsyncStorage.setItem("important_guide_acknowledged", "true");
      setShowImportantGuideModal(false);
      if (importantGuide) {
        setSelectedGuide(importantGuide);
      }
    } catch (error) {
      logger.error("Error saving acknowledgment:", error);
    }
  };

  const handleDismissModal = async () => {
    try {
      await AsyncStorage.setItem("important_guide_acknowledged", "true");
      setShowImportantGuideModal(false);
    } catch (error) {
      logger.error("Error saving acknowledgment:", error);
    }
  };

  const getIconForGuide = (title: string, emoji: string | null) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes("חופש") || lowerTitle.includes("טיס")) {
      return <Plane color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("גליקמי") || lowerTitle.includes("סוכר")) {
      return <Activity color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("שישי") || lowerTitle.includes("ארוחת")) {
      return <Utensils color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("צום")) {
      return <Calendar color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("יומ") || lowerTitle.includes("התנהלות")) {
      return <Sun color={colors.primary} size={32} />;
    }
    
    return <BookOpen color={colors.primary} size={32} />;
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>שגיאה בטעינת המדריכים</Text>
        </View>
      </LinearGradient>
    );
  }

  const getIconForEmoji = (emoji: string): ReactElement | null => {
    const iconMap: { [key: string]: ReactElement } = {
      '✅': <CheckCircle2 color="#10B981" size={16} />,
      '🔹': <CircleDot color={colors.primary} size={16} />,
      '🔺': <TrendingUp color="#EF4444" size={16} />,
      '‼️': <AlertCircle color="#F59E0B" size={16} />,
      '💢': <AlertCircle color="#EF4444" size={16} />,
      '🟢': <CheckCircle2 color="#10B981" size={16} />,
      '⚠️': <AlertCircle color="#F59E0B" size={16} />,
      '❌': <XCircle color="#EF4444" size={16} />,
      '💧': <Droplets color="#3B82F6" size={16} />,
      '☕': <Coffee color="#78350F" size={16} />,
      '🔥': <Flame color="#F97316" size={16} />,
      '🍎': <Apple color="#EF4444" size={16} />,
      '🐟': <Fish color="#3B82F6" size={16} />,
      '🌾': <Wheat color="#F59E0B" size={16} />,
      '🍬': <Candy color="#EC4899" size={16} />,
    };
    return iconMap[emoji] || null;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E0}-\u{1F1FF}\u{E0020}-\u{E007F}\u{200D}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '').trim();
  };

  const getIconsFromLine = (line: string) => {
    const emojis = ['✅', '🔹', '🔺', '‼️', '💢', '🟢', '⚠️', '❌', '💧', '☕', '🔥', '🍎', '🐟', '🌾', '🍬'];
    const foundEmojis: string[] = [];
    
    emojis.forEach(emoji => {
      if (line.includes(emoji)) {
        foundEmojis.push(emoji);
      }
    });
    
    return foundEmojis;
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      const isHeader = (
        (trimmedLine.startsWith('✅') || trimmedLine.startsWith('🔹') || 
         trimmedLine.startsWith('‼️') || trimmedLine.startsWith('💢') ||
         trimmedLine.startsWith('🟢')) &&
        (trimmedLine.endsWith('✅') || trimmedLine.endsWith('🟢') || trimmedLine.endsWith('‼️'))
      ) || (
        trimmedLine.endsWith(':') && !trimmedLine.includes('לדוגמה')
      );

      if (!trimmedLine) {
        return <View key={index} style={{ height: 10 }} />;
      }

      const emojisInLine = getIconsFromLine(line);
      const cleanedLine = removeEmojis(line);

      return (
        <View key={index} style={styles.contentLineContainer}>
          <View style={styles.contentTextWrapper}>
            {emojisInLine.map((emoji, emojiIndex) => (
              <View key={emojiIndex} style={styles.iconWrapper}>
                {getIconForEmoji(emoji)}
              </View>
            ))}
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.contentLine,
                  isHeader && styles.contentHeader,
                ]}
              >
                {cleanedLine}
              </Text>
            </View>
          </View>
        </View>
      );
    });
  };

  if (selectedGuide) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>{selectedGuide.title}</Text>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <ChevronRight color={colors.white} size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.detailIconContainer}>
            {getIconForGuide(selectedGuide.title, selectedGuide.emoji)}
          </View>
          {selectedGuide.short_description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.guideDescription}>
                {selectedGuide.short_description}
              </Text>
            </View>
          )}
          <View style={styles.contentCard}>
            {renderContent(selectedGuide.content)}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3FCDD1", "#FFFFFF"]}
      locations={[0, 0.4]}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.customHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow1}>
          <View style={styles.backButtonNew} />
          <BookOpen color={colors.white} size={28} />
          <TouchableOpacity onPress={handleBack} style={styles.backButtonNew}>
            <ArrowRight color={colors.white} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.customHeaderTitle}>מדריכים</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {guides && guides.length > 0 ? (
          guides.map((guide, index) => {
            const isImportant = guide.title.includes("דגשים") && guide.title.includes("חשובים");
            
            if (isImportant) {
              return (
                <Animated.View
                  key={guide.guide_id}
                  style={{
                    opacity: fadeAnims.current[index] || 1,
                    transform: [
                      { translateY: slideAnims.current[index] || 0 },
                      { scale: pulseAnim }
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={styles.importantGuideCard}
                    onPress={() => setSelectedGuide(guide)}
                  >
                    <LinearGradient
                      colors={["#FFD700", "#FFA500"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.importantGradient}
                    >
                      <View style={styles.importantBadge}>
                        <Text style={styles.importantBadgeText}>חשוב במיוחד</Text>
                        <AlertCircle color="#FFF" size={20} />
                      </View>
                      <View style={styles.importantContent}>
                        {/* Arrow on LEFT */}
                        <ChevronLeft color={colors.white} size={24} />
                        
                        {/* Icon + Text grouped together on RIGHT */}
                        <View style={styles.importantContentGroup}>
                          <View style={styles.guideInfo}>
                            <Text style={styles.importantGuideTitle}>
                              {guide.title}
                            </Text>
                            {guide.short_description && (
                              <Text 
                                style={styles.importantGuideDescription} 
                                numberOfLines={2}
                              >
                                {guide.short_description}
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.importantIconContainer}>
                            {getIconForGuide(guide.title, guide.emoji)}
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            }
            
            return (
              <Animated.View
                key={guide.guide_id}
                style={{
                  opacity: fadeAnims.current[index] || 1,
                  transform: [{ translateY: slideAnims.current[index] || 0 }],
                }}
              >
                <TouchableOpacity
                  style={styles.guideCard}
                  onPress={() => setSelectedGuide(guide)}
                >
                  {/* Arrow on LEFT */}
                  <ChevronLeft color={colors.gray} size={20} />
                  
                  {/* Icon + Text grouped together on RIGHT */}
                  <View style={styles.guideContentGroup}>
                    <View style={styles.guideInfo}>
                      <Text style={styles.guideTitle}>
                        {guide.title}
                      </Text>
                      {guide.short_description && (
                        <Text 
                          style={styles.guideDescriptionShort} 
                          numberOfLines={2}
                        >
                          {guide.short_description}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.guideIconContainer}>
                      {getIconForGuide(guide.title, guide.emoji)}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <BookOpen color={colors.gray} size={64} />
            <Text style={styles.emptyText}>אין מדריכים זמינים כרגע</Text>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={showImportantGuideModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleDismissModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.modalIconContainer}>
                <AlertCircle color="#FFF" size={64} />
              </View>
              <Text style={styles.modalTitle}>מדריך חשוב!</Text>
              <Text style={styles.modalDescription}>
                {importantGuide?.title}
              </Text>
              <Text style={styles.modalSubtext}>
                מדריך זה מכיל מידע חיוני להתנהלות היומית שלך.
מומלץ לקרוא לפני השימוש באפליקציה.
              </Text>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleAcknowledgeImportantGuide}
              >
                <Text style={styles.modalPrimaryButtonText}>קרא עכשיו</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={handleDismissModal}
              >
                <Text style={styles.modalSecondaryButtonText}>אקרא מאוחר יותר</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    direction: 'rtl' as const,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: 'right' as const,
  },
  customHeader: {
    backgroundColor: "#000000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow1: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  backButtonNew: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: 'right' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'right' as const,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guideCardEmoji: {
    fontSize: 32,
  },
  guideIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  guideContentGroup: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  guideInfo: {
    flex: 1,
    gap: 4,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: 'right' as const,
  },
  guideDescriptionShort: {
    fontSize: 14,
    color: "#666",
    textAlign: 'right' as const,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'right' as const,
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  descriptionCard: {
    backgroundColor: "rgba(63, 205, 209, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(63, 205, 209, 0.2)",
  },
  guideDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    fontWeight: "600" as const,
    textAlign: 'right' as const,
  },
  contentCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentLine: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 4,
    textAlign: 'right',
  },
  contentHeader: {
    fontSize: 17,
    fontWeight: "700" as const,
    marginTop: 8,
    marginBottom: 8,
  },
  contentLineContainer: {
    marginBottom: 4,
  },
  contentTextWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  iconWrapper: {
    marginTop: 4,
  },
  importantGuideCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  importantGradient: {
    padding: 20,
    borderRadius: 20,
  },
  importantBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  importantBadgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700" as const,
    textAlign: 'right' as const,
  },
  importantContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  importantContentGroup: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  importantGuideTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'right' as const,
  },
  importantGuideDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: 'right' as const,
  },
  importantIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  modalGradient: {
    padding: 32,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  modalDescription: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'right' as const,
    writingDirection: "rtl" as const,
  },
  modalSubtext: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 32,
    textAlign: 'right' as const,
    lineHeight: 24,
    writingDirection: "rtl" as const,
  },
  modalPrimaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFA500",
    textAlign: 'right' as const,
  },
  modalSecondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
    textAlign: 'right' as const,
  },
});
