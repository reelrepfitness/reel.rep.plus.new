import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend,
} from "react-native-svg";

interface GlassMorphCardProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export function GlassMorphCard({
  width = 202,
  height = 446,
  children,
}: GlassMorphCardProps) {
  const borderRadius = height / 4.4;
  const svgWidth = width + 140;
  const svgHeight = height + 138;
  const offsetX = 70;
  const offsetY = 42;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={styles.svgBackground}
      >
        <Defs>
          <Filter
            id="dropShadow"
            x="0"
            y="0"
            width={svgWidth}
            height={svgHeight}
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <FeOffset dy="28" />
            <FeGaussianBlur stdDeviation="35" />
            <FeComposite in2="hardAlpha" operator="out" />
            <FeColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
            />
            <FeBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
          </Filter>

          <Filter
            id="innerShadow"
            x={offsetX}
            y={offsetY}
            width={width + 8}
            height={height + 6}
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <FeOffset dx="6" dy="6" />
            <FeGaussianBlur stdDeviation="12" />
            <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <FeColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0"
            />
            <FeBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </Filter>

          <Filter
            id="lightEffect"
            x={offsetX - 4}
            y={offsetY - 4}
            width={width + 8}
            height={height + 8}
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <FeOffset dx="-4" dy="-4" />
            <FeGaussianBlur stdDeviation="8" />
            <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <FeColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0"
            />
            <FeBlend mode="normal" in2="shape" result="effect1_innerShadow" />
            <FeColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <FeOffset dy="-2" />
            <FeGaussianBlur stdDeviation="8" />
            <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <FeColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0"
            />
            <FeBlend
              mode="normal"
              in2="effect1_innerShadow"
              result="effect2_innerShadow"
            />
          </Filter>

          <LinearGradient
            id="borderGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor="white" stopOpacity="0.7" />
            <Stop offset="0.34" stopColor="#F3F8FF" stopOpacity="0" />
            <Stop offset="0.68" stopColor="white" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#E4EFFF" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        <Rect
          x={offsetX}
          y={offsetY}
          width={width}
          height={height}
          rx={borderRadius}
          fill="white"
          fillOpacity="0.01"
          filter="url(#dropShadow)"
        />

        <Rect
          x={offsetX}
          y={offsetY}
          width={width}
          height={height}
          rx={borderRadius}
          fill="black"
          fillOpacity="0.01"
          filter="url(#innerShadow)"
          opacity={0.6}
        />

        <Rect
          x={offsetX}
          y={offsetY}
          width={width}
          height={height}
          rx={borderRadius}
          fill="white"
          fillOpacity="0.01"
          filter="url(#lightEffect)"
        />

        <Rect
          x={offsetX + 1.5}
          y={offsetY + 1.5}
          width={width - 3}
          height={height - 3}
          rx={borderRadius - 1.5}
          stroke="url(#borderGradient)"
          strokeWidth="3"
          fill="none"
          opacity={0.3}
        />
      </Svg>

      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative" as const,
    justifyContent: "center",
    alignItems: "center",
  },
  svgBackground: {
    position: "absolute" as const,
  },
  contentContainer: {
    zIndex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
