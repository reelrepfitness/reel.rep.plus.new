import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardAnimationDuration, setKeyboardAnimationDuration] = useState(250);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      setKeyboardAnimationDuration(e.duration || 250);
    };

    const onKeyboardHide = (e: any) => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      setKeyboardAnimationDuration(e.duration || 250);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible, keyboardAnimationDuration };
}
