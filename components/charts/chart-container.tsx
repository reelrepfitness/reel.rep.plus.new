import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface ChartContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, description, children }: ChartContainerProps) {
  return (
    <View style={styles.container}>
      {(title || description) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  content: {
    width: '100%',
  },
});
