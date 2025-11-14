import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { isRTL } from '@/lib/utils';

interface DoughnutChartData {
  label: string;
  value: number;
  color: string;
}

interface DoughnutChartConfig {
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  innerRadius?: number;
}

interface DoughnutChartProps {
  data: DoughnutChartData[];
  config?: DoughnutChartConfig;
}

export function DoughnutChart({ data, config }: DoughnutChartProps) {
  const defaultConfig: Required<DoughnutChartConfig> = {
    height: 250,
    showLabels: true,
    animated: true,
    duration: 1500,
    innerRadius: 0.5,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { height, showLabels, animated, duration, innerRadius } = finalConfig;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(1);
    }
  }, [animated, duration, animatedValue]);

  const centerX = height / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  const innerRadiusValue = radius * innerRadius;

  const createArc = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  let currentAngle = 0;
  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    return {
      ...item,
      startAngle,
      endAngle,
      path: createArc(startAngle, endAngle, radius, innerRadiusValue),
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={height} height={height}>
        <G>
          {segments.map((segment, index) => (
            <Path
              key={`segment-${index}`}
              d={segment.path}
              fill={segment.color}
              opacity={0.9}
            />
          ))}
        </G>
      </Svg>
      {showLabels && (
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label}: {item.value.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 24,
    gap: 12,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
  legendItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600' as const,
  },
});
