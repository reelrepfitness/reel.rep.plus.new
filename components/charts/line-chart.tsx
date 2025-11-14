import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface LineChartDataPoint {
  x: string;
  y: number;
  label: string;
}

interface LineChartConfig {
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  color?: string;
  interactive?: boolean;
  showYLabels?: boolean;
  yLabelCount?: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  config?: LineChartConfig;
}

const screenWidth = Dimensions.get('window').width;

export function LineChart({ data, config }: LineChartProps) {
  const defaultConfig: Required<LineChartConfig> = {
    height: 240,
    showGrid: true,
    showLabels: true,
    animated: true,
    duration: 1200,
    color: colors.primary,
    interactive: true,
    showYLabels: true,
    yLabelCount: 6,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { height, showGrid, showLabels, animated, duration, color, interactive, showYLabels, yLabelCount } = finalConfig;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const [activePoint, setActivePoint] = useState<number | null>(null);

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

  const paddingHorizontal = 50;
  const paddingVertical = 40;
  const chartWidth = screenWidth - paddingHorizontal * 2 - 40;
  const chartHeight = height - paddingVertical * 2;

  const yValues = data.map((d) => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  const points = data.map((point, index) => {
    const x = paddingHorizontal + (index / (data.length - 1)) * chartWidth;
    const y = paddingVertical + chartHeight - ((point.y - minY) / yRange) * chartHeight;
    return { x, y, originalY: point.y, label: point.label };
  });

  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => interactive,
    onMoveShouldSetPanResponder: () => interactive,
    onPanResponderGrant: (evt) => {
      if (!interactive) return;
      const touchX = evt.nativeEvent.locationX;
      const closest = points.reduce((prev, curr, index) => {
        const distance = Math.abs(curr.x - touchX);
        return distance < prev.distance ? { distance, index } : prev;
      }, { distance: Infinity, index: -1 });
      setActivePoint(closest.index);
    },
    onPanResponderMove: (evt) => {
      if (!interactive) return;
      const touchX = evt.nativeEvent.locationX;
      const closest = points.reduce((prev, curr, index) => {
        const distance = Math.abs(curr.x - touchX);
        return distance < prev.distance ? { distance, index } : prev;
      }, { distance: Infinity, index: -1 });
      setActivePoint(closest.index);
    },
    onPanResponderRelease: () => {
      if (!interactive) return;
      setActivePoint(null);
    },
  });

  const yLabels = Array.from({ length: yLabelCount }, (_, i) => {
    const value = maxY - (yRange * i) / (yLabelCount - 1);
    return value;
  });

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={{ width: '100%', height }}>
        <Svg width={screenWidth - 40} height={height}>
          {showGrid && (
            <>
              {yLabels.map((_, index) => {
                const y = paddingVertical + chartHeight * (index / (yLabelCount - 1));
                return (
                  <Line
                    key={`grid-${index}`}
                    x1={paddingHorizontal}
                    y1={y}
                    x2={paddingHorizontal + chartWidth}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    opacity={0.3}
                  />
                );
              })}
            </>
          )}

          <Path d={pathData} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point, index) => (
            <Circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={activePoint === index ? 8 : 5}
              fill={color}
              stroke="#fff"
              strokeWidth="2"
            />
          ))}

          {activePoint !== null && (
            <Line
              x1={points[activePoint].x}
              y1={paddingVertical}
              x2={points[activePoint].x}
              y2={height - paddingVertical}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity={0.5}
            />
          )}
        </Svg>

        {showYLabels && (
          <View style={[styles.yLabelsContainer, { height: chartHeight, top: paddingVertical }]}>
            {yLabels.map((value, index) => (
              <Text key={`y-label-${index}`} style={styles.yLabelText}>
                {value.toFixed(1)}
              </Text>
            ))}
          </View>
        )}

        {activePoint !== null && (
          <View
            style={[
              styles.tooltip,
              {
                left: points[activePoint].x - 40,
                top: points[activePoint].y - 60,
              },
            ]}
          >
            <Text style={styles.tooltipLabel}>{data[activePoint].label}</Text>
            <Text style={[styles.tooltipValue, { color }]}>{points[activePoint].originalY.toFixed(1)}</Text>
          </View>
        )}
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
  yLabelsContainer: {
    position: 'absolute',
    left: 5,
    justifyContent: 'space-between',
  },
  yLabelText: {
    fontSize: 10,
    color: colors.gray,
    fontWeight: '600' as const,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  tooltipLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600' as const,
  },
  tooltipValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 4,
  },
});
