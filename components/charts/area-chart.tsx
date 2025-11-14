import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface AreaChartDataPoint {
  x: string;
  y: number;
  label: string;
}

interface AreaChartConfig {
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  color?: string;
  gradientStartOpacity?: number;
  gradientEndOpacity?: number;
}

interface AreaChartProps {
  data: AreaChartDataPoint[];
  config?: AreaChartConfig;
}

const screenWidth = Dimensions.get('window').width;

export function AreaChart({ data, config }: AreaChartProps) {
  const defaultConfig: Required<AreaChartConfig> = {
    height: 200,
    showGrid: true,
    showLabels: true,
    animated: true,
    duration: 1500,
    color: colors.primary,
    gradientStartOpacity: 0.7,
    gradientEndOpacity: 0.0,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { height, showGrid, showLabels, animated, duration, color, gradientStartOpacity, gradientEndOpacity } = finalConfig;

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

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>אין נתונים להצגה</Text>
      </View>
    );
  }

  const paddingHorizontal = 40;
  const paddingVertical = 50;
  const chartWidth = screenWidth - 80;
  const chartHeight = height - paddingVertical * 2;

  const yValues = data.map((d) => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  const points = data.map((point, index) => {
    const x = paddingHorizontal + (index / (data.length - 1)) * chartWidth;
    const y = paddingVertical + chartHeight - ((point.y - minY) / yRange) * chartHeight;
    return { x, y, originalY: point.y };
  });

  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${height - paddingVertical} L ${paddingHorizontal} ${height - paddingVertical} Z`;

  return (
    <View style={styles.container}>
      <Svg width={screenWidth - 40} height={height}>
        <Defs>
          <SvgGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={gradientStartOpacity} />
            <Stop offset="1" stopColor={color} stopOpacity={gradientEndOpacity} />
          </SvgGradient>
        </Defs>

        {showGrid && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => {
              const y = paddingVertical + chartHeight * fraction;
              return (
                <Path
                  key={`grid-${index}`}
                  d={`M ${paddingHorizontal} ${y} L ${paddingHorizontal + chartWidth} ${y}`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  opacity={0.3}
                />
              );
            })}
          </>
        )}

        <Path d={areaPathData} fill="url(#areaGradient)" />

        <Path d={pathData} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <Circle key={`dot-${index}`} cx={point.x} cy={point.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
        ))}
      </Svg>

      <View style={[styles.valuesContainer, { paddingHorizontal: paddingHorizontal - 10 }]}>
        {points.map((point, index) => (
          <View key={`value-${index}`} style={[styles.valueWrapper, { left: point.x - paddingHorizontal + 10 }]}>
            <Text style={[styles.valueText, { color }]}>{point.originalY.toFixed(1)}</Text>
          </View>
        ))}
      </View>

      {showLabels && (
        <View style={[styles.labelsContainer, { paddingHorizontal: paddingHorizontal - 10 }]}>
          {data.map((point, index) => (
            <Text key={`label-${index}`} style={styles.labelText}>
              {point.x}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  labelText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600' as const,
  },
  noDataText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  valuesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  valueWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
});
