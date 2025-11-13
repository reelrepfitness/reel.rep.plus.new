import React from 'react';
import { View as RNView, ViewProps as RNViewProps } from 'react-native';

export function View({ style, ...props }: RNViewProps) {
  return <RNView style={style} {...props} />;
}
