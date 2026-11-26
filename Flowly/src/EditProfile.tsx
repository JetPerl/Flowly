import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAvatar } from './avatar/AvatarContext';
import { useThemeColors, type ThemeColors } from './theme/useThemeColors';

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  colors: ThemeColors;
};

const Field = ({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  autoCapitalize,
  colors,
}: FieldProps) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: colors.textMain }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          borderColor: colors.border,
          backgroundColor: colors.isDark ? colors.elevatedSurface : colors.baseSurface,
          color: colors.textMain,
        },
      ]}
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      placeholderTextColor={colors.textSecondary}
      keyboardAppearance={colors.isDark ? 'dark' : 'light'}
    />
  </View>
);

const EditProfile = () => {
  const { avatarSource } = useAvatar();
  const colors = useThemeColors();

  const [name, setName] = useState('Eliasz Burnas');
  const [primaryEmail, setPrimaryEmail] = useState('ilyaburnas@gmail.com');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  const cardThemeStyle = {
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
    shadowOpacity: colors.isDark ? 0 : 1,
    elevation: colors.isDark ? 0 : 2,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.baseSurface }]}
      edges={['left', 'right']}
    >
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          title: 'Личная информация',
          headerTransparent: true,
          headerTintColor: colors.textMain,
          headerTitleStyle: { color: colors.textMain },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, cardThemeStyle]}>
          <View style={styles.avatarRow}>
            <Image
              source={avatarSource}
              style={[styles.avatar, { backgroundColor: colors.iconSurface }]}
            />
            <View style={styles.avatarInputs}>
              <Field
                label="Имя"
                value={name}
                onChangeText={setName}
                placeholder="Введите имя"
                autoCapitalize="words"
                colors={colors}
              />
              <Field
                label="Email"
                value={primaryEmail}
                onChangeText={setPrimaryEmail}
                placeholder="Введите email"
                keyboardType="email-address"
                autoCapitalize="none"
                colors={colors}
              />
            </View>
          </View>
        </View>

        <View style={[styles.card, cardThemeStyle]}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Введите email"
            keyboardType="email-address"
            autoCapitalize="none"
            colors={colors}
          />
          <Field
            label="Дата рождения"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="ДД.ММ.ГГГГ"
            keyboardType="numeric"
            colors={colors}
          />
          <Field
            label="Пол"
            value={gender}
            onChangeText={setGender}
            placeholder="Укажите пол"
            autoCapitalize="words"
            colors={colors}
          />
          <Field
            label="Страна проживания"
            value={country}
            onChangeText={setCountry}
            placeholder="Укажите страну"
            autoCapitalize="words"
            colors={colors}
          />
          <Field
            label="Номер телефона"
            value={phone}
            onChangeText={setPhone}
            placeholder="+375 (xx) xxx-xx-xx"
            keyboardType="phone-pad"
            autoCapitalize="none"
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});

export default EditProfile;