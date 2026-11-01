import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAvatar } from './avatar/AvatarContext';

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

const Field = ({ label, value, placeholder, onChangeText, keyboardType, autoCapitalize }: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);

const EditProfile = () => {
  const { avatarSource } = useAvatar();
  const [name, setName] = useState('Eliasz Burnas');
  const [primaryEmail, setPrimaryEmail] = useState('ilyaburnas@gmail.com');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Личная информация',
          headerTransparent: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.avatarInputs}>
              <Field
                label="Имя"
                value={name}
                onChangeText={setName}
                placeholder="Введите имя"
                autoCapitalize="words"
              />
              <Field
                label="Email"
                value={primaryEmail}
                onChangeText={setPrimaryEmail}
                placeholder="Введите email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Введите email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Дата рождения"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="ДД.ММ.ГГГГ"
            keyboardType="numeric"
          />
          <Field
            label="Пол"
            value={gender}
            onChangeText={setGender}
            placeholder="Укажите пол"
            autoCapitalize="words"
          />
          <Field
            label="Страна проживания"
            value={country}
            onChangeText={setCountry}
            placeholder="Укажите страну"
            autoCapitalize="words"
          />
          <Field
            label="Номер телефона"
            value={phone}
            onChangeText={setPhone}
            placeholder="+375 (xx) xxx-xx-xx"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CARD_BORDER = '#E5E7EB';
const TEXT_MAIN = '#111827';
const INPUT_BG = '#F9FAFB';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
  },
  avatarInputs: {
    flex: 1,
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    fontSize: 16,
    color: TEXT_MAIN,
  },
});

export default EditProfile;
