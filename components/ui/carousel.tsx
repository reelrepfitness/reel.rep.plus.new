import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselProps {
  children: React.ReactNode;
  itemWidth?: number;
  spacing?: number;
  showIndicators?: boolean;
  indicatorColor?: string;
  activeIndicatorColor?: string;
}

interface CarouselItemProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Carousel({
  children,
  itemWidth = SCREEN_WIDTH * 0.8,
  spacing = 16,
  showIndicators = true,
  indicatorColor = '#CBD5E0',
  activeIndicatorColor = '#4A5568',
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const childrenArray = React.Children.toArray(children);
  const itemCount = childrenArray.length;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (itemWidth + spacing));
    setActiveIndex(currentIndex);
  };

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + spacing}
        snapToAlignment="start"
        contentInset={{
          left: (SCREEN_WIDTH - itemWidth) / 2,
          right: (SCREEN_WIDTH - itemWidth) / 2,
        }}
        contentContainerStyle={{
          paddingHorizontal: Platform.OS === 'android' ? (SCREEN_WIDTH - itemWidth) / 2 : 0,
          gap: spacing,
          flexDirection: 'row-reverse' as any,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {childrenArray.map((child, index) => (
          <View
            key={index}
            style={{
              width: itemWidth,
            }}
          >
            {React.isValidElement(child) ? child : null}
          </View>
        ))}
      </ScrollView>

      {showIndicators && itemCount > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
            gap: 8,
          }}
        >
          {childrenArray.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: activeIndex === index ? activeIndicatorColor : indicatorColor,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function CarouselItem({ children, style }: CarouselItemProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
