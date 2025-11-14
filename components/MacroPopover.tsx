import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { formatDate, isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Macropopover');

interface MacroItem {
  id: string;
  food_name: string;
  amount: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  calories: number;
}

interface MacroPopoverProps {
  children: React.ReactNode;
  macroName: string;
  macroType: 'protein' | 'carb' | 'fat' | 'fruit' | 'veg';
  macroColor: string;
  selectedDate?: string;
}

const MACRO_LABELS = {
  protein: 'חלבון',
  carb: 'פחמימות',
  fat: 'שומן',
  fruit: 'פירות',
  veg: 'ירקות',
};

const CATEGORY_MAP = {
  protein: 'protein',
  carb: 'carbs',
  fat: 'fats',
  fruit: 'fruit',
  veg: 'vegetables',
};

export function MacroPopover({ children, macroName, macroType, macroColor, selectedDate }: MacroPopoverProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<MacroItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const today = selectedDate || formatDate(new Date());

  const fetchMacroItemsCallback = useCallback(async () => {
    if (!user?.user_id) return;
    
    setIsLoading(true);
    try {
      logger.info('[MacroPopover] Fetching items for:', macroType, 'date:', today);
      
      const { data: dailyLog, error: logError } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('date', today)
        .single();

      if (logError || !dailyLog) {
        logger.info('[MacroPopover] No daily log found');
        setItems([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('daily_items')
        .select('id, food_name, amount, protein_units, carb_units, fat_units, veg_units, fruit_units, calories')
        .eq('daily_log_id', dailyLog.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[MacroPopover] Error fetching items:', error);
        setItems([]);
      } else {
        const filteredItems = (data || []).filter((item) => {
          const value = item[`${macroType}_units`];
          return value !== null && value !== undefined && value > 0;
        });
        
        logger.info('[MacroPopover] Filtered items:', filteredItems.length);
        setItems(filteredItems);
      }
    } catch (error) {
      logger.error('[MacroPopover] Error:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, today, macroType]);

  useEffect(() => {
    if (isOpen) {
      fetchMacroItemsCallback();
    }
  }, [isOpen, fetchMacroItemsCallback]);



  const handleAddMore = () => {
    setIsOpen(false);
    router.push({
      pathname: '/food-bank',
      params: { category: CATEGORY_MAP[macroType] },
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        style={styles.popoverContent}
      >
        <View style={styles.container}>
          <View style={[styles.header, { borderBottomColor: macroColor }]}>
            <Text style={styles.headerTitle}>{MACRO_LABELS[macroType]}</Text>
            <Text style={styles.headerSubtitle}>צריכה יומית</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={macroColor} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>לא נוספו מאכלים היום</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.food_name}
                    </Text>
                    <Text style={styles.itemDetails}>
                      {item.amount}g • {Math.round(item.calories)} קק״ל
                    </Text>
                  </View>
                  <View style={[styles.itemBadge, { backgroundColor: macroColor }]}>
                    <Text style={styles.itemBadgeText}>
                      {item[`${macroType}_units`]?.toFixed(1)}
                    </Text>
                  </View>
                </View>
              ))}
              {items.length > 5 && (
                <Text style={styles.moreText}>ועוד {items.length - 5} מאכלים...</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: macroColor }]}
            onPress={handleAddMore}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>
              להוסיף עוד {MACRO_LABELS[macroType]}
            </Text>
          </TouchableOpacity>
        </View>
      </PopoverContent>
    </Popover>
  );
}

const styles = StyleSheet.create({
  popoverContent: {
    padding: 0,
    minWidth: 280,
    maxWidth: 320,
  },
  container: {
    width: '100%',
  },
  header: {
    padding: 16,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  itemsList: {
    padding: 12,
    maxHeight: 250,
  },
  itemRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
    marginStart: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: isRTL ? 'right' : 'left',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#718096',
    textAlign: isRTL ? 'right' : 'left',
  },
  itemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  itemBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addButton: {
    margin: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
