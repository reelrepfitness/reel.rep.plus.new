import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { isRTL } from '@/lib/utils';

interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface RadioButtonProps {
  option: RadioOption;
  selected: boolean;
  onPress: () => void;
}

export function RadioButton({ option, selected, onPress }: RadioButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.radioContainer, option.disabled && styles.disabled]}
      onPress={onPress}
      disabled={option.disabled}
      activeOpacity={0.7}
    >
      <View style={styles.radioCircle}>
        {selected && <View style={styles.radioSelected} />}
      </View>
      <Text style={[styles.radioLabel, option.disabled && styles.disabledText]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: (isRTL ? 'row-reverse' : 'row') as const,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3FCDD1',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 12,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3FCDD1',
  },
  radioLabel: {
    fontSize: 16,
    color: '#2d3748',
    flex: 1,
    textAlign: (isRTL ? 'right' : 'left') as const,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#A0AEC0',
  },
});
