import React from 'react';
import { Animated, Platform } from 'react-native';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

export function AvoidKeyboard() {
  const { keyboardHeight, keyboardAnimationDuration } = useKeyboardHeight();
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: keyboardHeight,
      duration: keyboardAnimationDuration,
      useNativeDriver: false,
    }).start();
  }, [keyboardHeight, keyboardAnimationDuration]);

  if (Platform.OS === 'web') {
    return null;
  }

  return <Animated.View style={{ height: animatedHeight }} />;
}
