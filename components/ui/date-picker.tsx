import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { isRTL } from '@/lib/utils';

type DatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
};

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'בחר תאריך',
}: DatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(value || new Date());

  const handleDateChange = (newDate: Date) => {
    setInternalDate(newDate);
    if (onChange) {
      onChange(newDate);
    }
  };

  const displayDate = value || internalDate;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Calendar color={colors.primary} size={20} />
        <Text style={styles.dateText}>
          {displayDate
            ? displayDate.toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable style={styles.datePickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDone}>סגור</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>בחר תאריך</Text>
                <View style={{ width: 60 }} />
              </View>
              
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    const today = new Date();
                    handleDateChange(today);
                    setShowDatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateButtonText}>היום</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    handleDateChange(yesterday);
                    setShowDatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateButtonText}>אתמול</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.manualDateContainer}>
                <Text style={styles.manualDateLabel}>או בחר תאריך ספציפי:</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="יום"
                    placeholderTextColor={colors.gray}
                    value={internalDate.getDate().toString()}
                    onChangeText={(text) => {
                      const day = parseInt(text) || 1;
                      const newDate = new Date(internalDate);
                      newDate.setDate(Math.min(Math.max(day, 1), 31));
                      handleDateChange(newDate);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="חודש"
                    placeholderTextColor={colors.gray}
                    value={(internalDate.getMonth() + 1).toString()}
                    onChangeText={(text) => {
                      const month = parseInt(text) || 1;
                      const newDate = new Date(internalDate);
                      newDate.setMonth(Math.min(Math.max(month - 1, 0), 11));
                      handleDateChange(newDate);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="שנה"
                    placeholderTextColor={colors.gray}
                    value={internalDate.getFullYear().toString()}
                    onChangeText={(text) => {
                      const year = parseInt(text) || new Date().getFullYear();
                      const newDate = new Date(internalDate);
                      newDate.setFullYear(year);
                      handleDateChange(newDate);
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: (isRTL ? 'right' : 'left'),
  },
  pickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.43)',
    borderRadius: 24,
    padding: 16,
    flexDirection: (isRTL ? 'row-reverse' : 'row') as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(6.95px)',
      } as any,
    }),
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  datePickerHeader: {
    flexDirection: (isRTL ? 'row-reverse' : 'row') as any,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  datePickerButtons: {
    flexDirection: (isRTL ? 'row-reverse' : 'row') as any,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  manualDateContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  manualDateLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: (isRTL ? 'right' : 'left'),
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    fontWeight: '600' as const,
    minWidth: 70,
  },
  dateSeparator: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray,
  },
});
