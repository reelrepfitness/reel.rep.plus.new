import React from 'react';
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
} from 'react-native';

export interface ScrollViewProps extends RNScrollViewProps {
  horizontal?: boolean;
}

export function ScrollView({ style, ...props }: ScrollViewProps) {
  return <RNScrollView style={style} {...props} />;
}
