import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { isRTL } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'danger';

type ToastAction = {
  label: string;
  onPress: () => void;
};

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
};

type ToastContextType = {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

type ToastData = ToastOptions & {
  id: string;
};

const { width: screenWidth } = Dimensions.get('window');

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = options.duration || 4000;

    setToasts((prev) => [...prev, { ...options, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'success' });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'error' });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'info' });
  }, [toast]);

  const contextValue = useMemo(() => ({ toast, success, error, warning, info }), [toast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toastData) => (
          <ToastItem
            key={toastData.id}
            {...toastData}
            onDismiss={() => removeToast(toastData.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({
  title,
  description,
  variant = 'info',
  action,
  onDismiss,
}: ToastData & { onDismiss: () => void }) {
  const [animation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [animation]);

  const handleDismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getIcon = () => {
    const iconProps = { size: 24, color: colors.white };
    switch (variant) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertCircle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return '#43A047';
      case 'error':
      case 'danger':
        return '#E53935';
      case 'warning':
        return '#FB8C00';
      case 'info':
      default:
        return colors.primary;
    }
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{title}</Text>
          {description && <Text style={styles.toastDescription}>{description}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {action && (
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            handleDismiss();
          }}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    left: 16,
    zIndex: 9999,
    gap: 12,
  },
  toast: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: screenWidth - 32,
  },
  toastContent: {
    flexDirection: (isRTL ? 'row-reverse' : 'row') as any,
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    textAlign: (isRTL ? 'right' : 'left'),
    marginBottom: 2,
  },
  toastDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: (isRTL ? 'right' : 'left'),
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    alignSelf: (isRTL ? 'flex-end' : 'flex-start'),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
