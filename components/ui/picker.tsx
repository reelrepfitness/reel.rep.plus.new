import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { isRTL } from '@/lib/utils';

export type PickerOption = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

type PickerProps = {
  options: PickerOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  label?: string;
  variant?: 'outline' | 'filled' | 'group';
  style?: any;
};

export function Picker({
  options,
  value,
  onValueChange,
  placeholder = 'בחר...',
  icon: Icon,
  label,
  variant = 'outline',
  style,
}: PickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const containerStyle = [
    styles.container,
    variant === 'outline' && styles.containerOutline,
    variant === 'filled' && styles.containerFilled,
    variant === 'group' && styles.containerGroup,
    style,
  ];

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={containerStyle}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color="#2d3748" />
          </View>
        )}
        
        <View style={styles.textContainer}>
          {selectedOption ? (
            <View style={styles.selectedContent}>
              {selectedOption.icon && (
                <View style={styles.selectedIconContainer}>
                  <selectedOption.icon size={18} color="#2d3748" />
                </View>
              )}
              <Text style={styles.selectedText}>{selectedOption.label}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>

        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {options.map((option) => {
                const isSelected = option.value === value;
                const OptionIcon = option.icon;
                
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    {OptionIcon && (
                      <View style={styles.optionIconContainer}>
                        <OptionIcon
                          size={20}
                          color={isSelected ? '#FFFFFF' : '#2d3748'}
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: (isRTL ? 'row-reverse' : 'row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  containerOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerFilled: {
    backgroundColor: '#F7FAFC',
    borderWidth: 0,
  },
  containerGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: (isRTL ? 'right' : 'left'),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  selectedContent: {
    flexDirection: (isRTL ? 'row-reverse' : 'row'),
    alignItems: 'center',
    gap: 8,
  },
  selectedIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: (isRTL ? 'right' : 'left'),
  },
  placeholderText: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: (isRTL ? 'right' : 'left'),
  },
  chevron: {
    fontSize: 12,
    color: '#718096',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: (isRTL ? 'row-reverse' : 'row'),
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  optionItemSelected: {
    backgroundColor: '#3182CE',
  },
  optionIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    textAlign: (isRTL ? 'right' : 'left'),
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
