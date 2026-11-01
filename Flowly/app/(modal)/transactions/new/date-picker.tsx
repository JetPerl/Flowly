import React, { useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CrossIcon from '../../../../assets/icons/menu/cross.svg';
import { GlassButton } from '../../../../src/components/LiquidHeaderActions';
import { useTransactionDraft } from './_TransactionDraftContext';
import { formatLongDateRu, formatTimeLabel } from './_utils';

const COLORS = {
  textMain: '#212121',
  textSecondary: '#6B7280',
  purple: '#2BAF8C',
};

export default function TransactionDatePickerScreen() {
  const router = useRouter();
  const { draft, setDate } = useTransactionDraft();
  const [date, setLocalDate] = useState(draft.date);

  const label = useMemo(() => formatLongDateRu(date), [date]);
  const timeLabel = useMemo(() => formatTimeLabel(date), [date]);

  const handleSave = () => {
    setDate(date);
    router.back();
  };

  const handleDateChange = (_: any, nextDate?: Date) => {
    if (!nextDate) return;
    const merged = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate(),
      date.getHours(),
      date.getMinutes(),
    );
    setLocalDate(merged);
  };

  const handleTimeChange = (_: any, nextTime?: Date) => {
    if (!nextTime) return;
    const merged = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      nextTime.getHours(),
      nextTime.getMinutes(),
    );
    setLocalDate(merged);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Дата',
        }}
      />

      <View style={styles.header}>
        <GlassButton
          size={44}
          onPress={() => router.back()}
          icon={<CrossIcon width={20} height={20} stroke={COLORS.textMain} />}
        />
        <Text style={styles.headerTitle}>Дата</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.title}>Выберите дату и время</Text>
      <Text style={styles.subtitle}>{label}</Text>

      <View style={styles.pickerWrapper}>
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          locale="ru-RU"
          onChange={handleDateChange}
          style={styles.picker}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>{timeLabel}</Text>
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          locale="ru-RU"
          onChange={handleTimeChange}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.buttonSecondary} onPress={() => setLocalDate(new Date())}>
          <Text style={styles.buttonSecondaryText}>Сейчас</Text>
        </Pressable>
        <Pressable style={styles.buttonPrimary} onPress={handleSave}>
          <Text style={styles.buttonPrimaryText}>Готово</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 8,
  },
  picker: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  buttonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  buttonSecondaryText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  buttonPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
  },
  buttonPrimaryText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
