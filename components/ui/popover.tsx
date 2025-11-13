import React, { createContext, useContext, useState, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerLayout: { x: number; y: number; width: number; height: number } | null;
  setTriggerLayout: (layout: { x: number; y: number; width: number; height: number }) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover');
  }
  return context;
}

interface PopoverProps {
  children: React.ReactNode;
}

export function Popover({ children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      triggerLayout,
      setTriggerLayout,
    }),
    [isOpen, triggerLayout]
  );

  return (
    <PopoverContext.Provider value={value}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  const { setIsOpen, setTriggerLayout } = usePopoverContext();
  const viewRef = useRef<View>(null);

  const handlePress = () => {
    if (viewRef.current) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setIsOpen(true);
      });
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: viewRef,
      onPress: handlePress,
    });
  }

  return (
    <TouchableOpacity ref={viewRef} onPress={handlePress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

interface PopoverContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  style?: object;
}

export function PopoverContent({
  children,
  align = 'center',
  side = 'bottom',
  style,
}: PopoverContentProps) {
  const { isOpen, setIsOpen, triggerLayout } = usePopoverContext();
  const bgColor = '#FFFFFF';
  const borderColor = '#E2E8F0';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen || !triggerLayout) return null;

  const getPosition = () => {
    const PADDING = 8;
    const CONTENT_WIDTH = 250;
    const CONTENT_HEIGHT = 200;

    let left = triggerLayout.x;
    let top = triggerLayout.y;

    switch (side) {
      case 'bottom':
        top = triggerLayout.y + triggerLayout.height + PADDING;
        break;
      case 'top':
        top = triggerLayout.y - CONTENT_HEIGHT - PADDING;
        break;
      case 'left':
        left = triggerLayout.x - CONTENT_WIDTH - PADDING;
        break;
      case 'right':
        left = triggerLayout.x + triggerLayout.width + PADDING;
        break;
    }

    switch (align) {
      case 'start':
        left = triggerLayout.x;
        break;
      case 'center':
        left = triggerLayout.x + triggerLayout.width / 2 - CONTENT_WIDTH / 2;
        break;
      case 'end':
        left = triggerLayout.x + triggerLayout.width - CONTENT_WIDTH;
        break;
    }

    left = Math.max(PADDING, Math.min(left, SCREEN_WIDTH - CONTENT_WIDTH - PADDING));
    top = Math.max(PADDING, Math.min(top, SCREEN_HEIGHT - CONTENT_HEIGHT - PADDING));

    return { left, top };
  };

  const position = getPosition();

  return (
    <Modal transparent visible={isOpen} onRequestClose={() => setIsOpen(false)} animationType="none">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setIsOpen(false)}
      >
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: bgColor,
              borderColor: borderColor,
              position: 'absolute',
              left: position.left,
              top: position.top,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
            style,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

interface PopoverCloseProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function PopoverClose({ asChild, children }: PopoverCloseProps) {
  const { setIsOpen } = usePopoverContext();

  const handlePress = () => {
    setIsOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: handlePress,
    });
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      } as any,
    }),
  },
});
