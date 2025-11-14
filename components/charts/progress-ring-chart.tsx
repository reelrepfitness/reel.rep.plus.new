import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface ProgressRingChartConfig {
  animated?: boolean;
  duration?: number;
  gradient?: boolean;
}

interface ProgressRingChartProps {
  progress: number;
  size: number;
  strokeWidth: number;
  config?: ProgressRingChartConfig;
  showLabel?: boolean;
  label?: string;
  centerText?: string;
  color?: string;
  gradientColors?: [string, string];
  centerContent?: React.ReactNode;
}

export function ProgressRingChart({
  progress,
  size,
  strokeWidth,
  config,
  showLabel = false,
  label,
  centerText,
  color = colors.primary,
  gradientColors,
  centerContent,
}: ProgressRingChartProps) {
  const defaultConfig: ProgressRingChartConfig = {
    animated: true,
    duration: 1500,
    gradient: false,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { animated, duration, gradient } = finalConfig;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated, duration, animatedValue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (circumference * progressValue) / 100;

  const gradientId = `gradient-${Math.random().toString(36).substring(7)}`;
  const [startColor, endColor] = gradientColors || [color, color];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {gradient && gradientColors && (
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={startColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={endColor} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
        )}
        
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(156, 163, 175, 0.3)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient && gradientColors ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          {...(Platform.OS === 'web' ? { transformOrigin: `${size / 2} ${size / 2}` } : { origin: `${size / 2}, ${size / 2}` })}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        {centerContent ? (
          centerContent
        ) : centerText ? (
          <Text style={styles.centerText}>{centerText}</Text>
        ) : null}
      </View>

      {showLabel && label && (
        <Text style={styles.labelText}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  svg: {
    position: 'absolute' as const,
  },
  centerContent: {
    position: 'absolute' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  labelText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
});
