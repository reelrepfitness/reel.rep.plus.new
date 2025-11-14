import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Utensils,
  BookOpen,
  Settings,
  Bell,
  BarChart3,
  MessageCircle,
  LayoutDashboard,
  X,
} from 'lucide-react-native';
import { SheetRoot, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth';
import { isRTL } from '@/lib/utils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Adminmenusheet');

interface AdminMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScreen?: string;
}

const menuItems = [
  { id: 'dashboard', title: 'מסך ניהול', icon: LayoutDashboard, route: '/admin-dashboard' },
  { id: 'clients', title: 'לקוחות', icon: Users, route: '/admin-clients' },
  { id: 'notifications', title: 'ניהול התראות', icon: Bell, route: '/admin-notifications' },
  { id: 'add-food', title: 'הוסף מזון', icon: Utensils, route: '/admin-add-food' },
  { id: 'guides', title: 'מדריכים', icon: BookOpen, route: '/admin-guides' },
  { id: 'analytics', title: 'דוחות ואנליטיקה', icon: BarChart3, route: '/admin-analytics' },
  { id: 'settings', title: 'הגדרות', icon: Settings, route: '/admin-settings' },
  { id: 'support', title: 'תמיכה ופניות', icon: MessageCircle, route: '/admin-support' },
];

export function AdminMenuSheet({ open, onOpenChange, currentScreen }: AdminMenuSheetProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleMenuSelect = (menuItem: typeof menuItems[0]) => {
    logger.info('[AdminMenuSheet] Menu selected:', menuItem.id);
    onOpenChange(false);
    
    if (menuItem.route) {
      router.push(menuItem.route as any);
    }
  };

  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <LinearGradient colors={['#3FCDD1', '#2AB8BC']} style={styles.drawerHeader}>
          <View style={styles.drawerHeaderContent}>
            <Text style={styles.drawerTitle}>תפריט מנהל</Text>
            <TouchableOpacity onPress={() => onOpenChange(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>{user?.email?.charAt(0).toUpperCase() || 'A'}</Text>
            </View>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>איוון</Text>
              <Text style={styles.adminRole}>מנהל מערכת</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menuItemsContainer}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = currentScreen === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                onPress={() => handleMenuSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemText, isSelected && styles.menuItemTextSelected]}>{item.title}</Text>
                  <IconComponent size={22} color={isSelected ? '#3FCDD1' : '#64748B'} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SheetContent>
    </SheetRoot>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  drawerHeaderContent: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  adminInfo: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  adminDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  adminName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuItemsContainer: {
    paddingTop: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemSelected: {
    backgroundColor: 'rgba(63, 205, 209, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#3FCDD1',
  },
  menuItemContent: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  menuItemTextSelected: {
    color: '#3FCDD1',
    fontWeight: '700' as const,
  },
});
