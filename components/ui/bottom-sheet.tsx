import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[];
  children: React.ReactNode;
}

export function BottomSheet({
  isVisible,
  onClose,
  title,
  snapPoints = [0.5, 0.9],
  children,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

  const snapHeights = snapPoints.map((point) => SCREEN_HEIGHT * (1 - point));

  useEffect(() => {
    if (isVisible) {
      setCurrentSnapIndex(0);
      Animated.spring(translateY, {
        toValue: snapHeights[0],
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, snapHeights, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = snapHeights[currentSnapIndex] + gestureState.dy;
        if (newValue >= 0) {
          translateY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = snapHeights[currentSnapIndex] + gestureState.dy;
        const velocity = gestureState.vy;

        if (velocity > 1.5 || currentY > SCREEN_HEIGHT * 0.7) {
          onClose();
          return;
        }

        let targetSnapIndex = currentSnapIndex;
        let minDistance = Math.abs(currentY - snapHeights[currentSnapIndex]);

        snapHeights.forEach((snapHeight, index) => {
          const distance = Math.abs(currentY - snapHeight);
          if (distance < minDistance) {
            minDistance = distance;
            targetSnapIndex = index;
          }
        });

        setCurrentSnapIndex(targetSnapIndex);

        Animated.spring(translateY, {
          toValue: snapHeights[targetSnapIndex],
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
          velocity,
        }).start();
      },
    })
  ).current;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: translateY.interpolate({
                  inputRange: [0, SCREEN_HEIGHT],
                  outputRange: [1, 0],
                }),
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheetContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.header}>
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        <ScrollView
          style={styles.contentWrapper}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

export function useBottomSheet() {
  const [isVisible, setIsVisible] = useState(false);

  const open = () => setIsVisible(true);
  const close = () => setIsVisible(false);

  return { isVisible, open, close };
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
  bottomSheetContainer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
