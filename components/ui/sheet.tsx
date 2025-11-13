import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'bottom';
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <>{children}</>;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function SheetTrigger({ children }: SheetTriggerProps) {
  return <>{children}</>;
}

interface SheetContentProps {
  children: React.ReactNode;
  side?: 'left' | 'right' | 'bottom';
}

export function SheetContent({ children, side = 'right' }: SheetContentProps) {
  const SheetContext = React.useContext(SheetInternalContext);
  
  const translateX = useRef(
    new Animated.Value(side === 'right' ? SCREEN_WIDTH : side === 'left' ? -SCREEN_WIDTH : 0)
  ).current;
  const translateY = useRef(new Animated.Value(side === 'bottom' ? SCREEN_HEIGHT : 0)).current;
  
  const { open, onOpenChange } = SheetContext || { open: false, onOpenChange: () => {} };

  useEffect(() => {
    if (side === 'bottom') {
      if (open) {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (open) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      } else {
        Animated.timing(translateX, {
          toValue: side === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [open, side, translateX, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (side === 'right' && gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        } else if (side === 'left' && gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        } else if (side === 'bottom' && gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose =
          (side === 'right' && gestureState.dx > SCREEN_WIDTH * 0.3) ||
          (side === 'left' && gestureState.dx < -SCREEN_WIDTH * 0.3) ||
          (side === 'bottom' && gestureState.dy > SCREEN_HEIGHT * 0.3);

        if (shouldClose) {
          onOpenChange(false);
        } else {
          if (side === 'bottom') {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          }
        }
      },
    })
  ).current;
  
  if (!SheetContext) return null;

  const getSheetStyle = () => {
    if (side === 'bottom') {
      return {
        ...styles.sheetContainerBottom,
        transform: [{ translateY }],
      };
    } else if (side === 'right') {
      return {
        ...styles.sheetContainerRight,
        transform: [{ translateX }],
      };
    } else {
      return {
        ...styles.sheetContainerLeft,
        transform: [{ translateX }],
      };
    }
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={getSheetStyle()} {...panResponder.panHandlers}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <View style={styles.header}>{children}</View>;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

export function SheetTitle({ children }: SheetTitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
}

export function SheetDescription({ children }: SheetDescriptionProps) {
  return <Text style={styles.description}>{children}</Text>;
}

interface SheetCloseProps {
  children: React.ReactNode;
}

export function SheetClose({ children }: SheetCloseProps) {
  const SheetContext = React.useContext(SheetInternalContext);
  const { onOpenChange } = SheetContext || { onOpenChange: () => {} };

  if (!SheetContext) return <>{children}</>;
  
  return (
    <TouchableOpacity onPress={() => onOpenChange(false)} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

const SheetInternalContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

Sheet.displayName = 'Sheet';
SheetTrigger.displayName = 'SheetTrigger';
SheetContent.displayName = 'SheetContent';
SheetHeader.displayName = 'SheetHeader';
SheetTitle.displayName = 'SheetTitle';
SheetDescription.displayName = 'SheetDescription';
SheetClose.displayName = 'SheetClose';

export function SheetRoot({ open, onOpenChange, children }: SheetProps) {
  const value = useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <SheetInternalContext.Provider value={value}>{children}</SheetInternalContext.Provider>;
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainerRight: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  sheetContainerLeft: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  sheetContainerBottom: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: SCREEN_HEIGHT * 0.5,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default function SheetComponent({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      {children}
    </SheetRoot>
  );
}
