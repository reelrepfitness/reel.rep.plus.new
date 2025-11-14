import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import { isRTL } from '@/lib/utils';

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  placeholder?: string;
  icon?: LucideIcon;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
}

export function Input({
  label,
  placeholder,
  icon: Icon,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isPassword = secureTextEntry;
  const inputSecure = isPassword && !showPassword;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {Icon ? (
          <Icon size={20} color={error ? '#FF5252' : '#6C7278'} strokeWidth={2} />
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#ACB5BB"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={inputSecure}
          textAlign={isRTL ? "right" : "left"}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <Eye size={20} color="#6C7278" strokeWidth={2} />
            ) : (
              <EyeOff size={20} color="#6C7278" strokeWidth={2} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontWeight: '600' as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: '#111827',
    textAlign: (isRTL ? 'right' : 'left') as const,
  },
  inputWrapper: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: (isRTL ? 'row-reverse' : 'row') as const,
    alignItems: 'center' as const,
    gap: 10,
    shadowColor: '#E4E5E7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  input: {
    flex: 1,
    fontWeight: '500' as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: '#1A1C1E',
    textAlign: (isRTL ? 'right' : 'left') as const,
    paddingVertical: 0,
    textAlignVertical: 'center' as const,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontWeight: '500' as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: '#FF5252',
    textAlign: (isRTL ? 'right' : 'left') as const,
  },
});
