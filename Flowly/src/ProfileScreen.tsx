import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAvatar } from './avatar/AvatarContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMainCurrency } from './currency/CurrencyContext';
import { useThemeColors } from './theme/useThemeColors';

const ProfileScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { avatarSource, setAvatar, resetAvatar } = useAvatar();
  const { mainCurrency } = useMainCurrency();

  const handleRemoveAvatar = useCallback(async () => {
    await resetAvatar();
  }, [resetAvatar]);

  const handlePickAvatar = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Фото', 'Нужен доступ к фото, чтобы выбрать аватар.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (uri) {
          await setAvatar(uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Фото', 'Не удалось выбрать изображение. Попробуйте снова.');
      console.warn('avatar pick error', err);
    }
  }, [setAvatar]);

  const openAvatarAlert = useCallback(() => {
    Alert.alert('Аватар', 'Выберите действие', [
      { text: 'Выбрать фото', onPress: handlePickAvatar },
      { text: 'Удалить фото', onPress: handleRemoveAvatar, style: 'destructive' },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, [handlePickAvatar, handleRemoveAvatar]);

  const sectionCardStyle = {
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
    shadowOpacity: colors.isDark ? 0 : 0.05,
    elevation: colors.isDark ? 0 : 3,
  };

  const iconTint = colors.textSecondary;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.baseSurface }]}
      edges={['left', 'right']}
    >
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <TouchableOpacity
            style={[
              styles.avatarWrapper,
              {
                borderColor: colors.cardSurface,
                backgroundColor: colors.cardSurface,
                shadowOpacity: colors.isDark ? 0 : 0.15,
                elevation: colors.isDark ? 0 : 6,
              },
            ]}
            activeOpacity={0.9}
            onPress={openAvatarAlert}
          >
            <Image
              source={avatarSource}
              style={[styles.avatar, { backgroundColor: colors.iconSurface }]}
            />
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.textMain }]}>Eliasz Burnas</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            ilyaburnas@gmail.com
          </Text>
        </View>

        <View style={[styles.listSection, sectionCardStyle]}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/currency-list')}>
            <MaterialIcons
              name="currency-exchange"
              size={22}
              color={iconTint}
              style={styles.vectorIcon}
            />
            <Text style={[styles.rowText, { color: colors.textMain }]}>Основная валюта</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
              {mainCurrency?.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/edit-profile')}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>👤</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Личная информация</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/security')}>
            <MaterialCommunityIcons
              name="shield-check"
              size={22}
              color={iconTint}
              style={styles.vectorIcon}
            />
            <Text style={[styles.rowText, { color: colors.textMain }]}>Вход и безопасность</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>🔔</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Напоминания</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>💬</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Язык приложения</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>❓</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Помощь</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>🔔</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>
              Включить синхронизацию
            </Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>㊢</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Резервные копии</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>🔔</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Экспорт</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>㊢</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Импорт</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listSection, sectionCardStyle]}>
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>👥</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Выйти</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.switchIcon, { color: iconTint }]}>👥</Text>
            <Text style={[styles.rowText, { color: colors.textMain }]}>Сменить пользователя</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  hero: {
    marginTop: 8,
    alignItems: 'center',
    position: 'relative',
  },
  avatarWrapper: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    marginTop: 110,
    fontSize: 20,
    fontWeight: '600',
  },
  userEmail: {
    marginTop: 6,
    fontSize: 14,
  },
  listSection: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
    marginRight: 16,
  },
  vectorIcon: {
    width: 34,
    textAlign: 'center',
  },
  switchIcon: {
    fontSize: 22,
    width: 34,
    textAlign: 'center',
  },
  rowText: {
    fontSize: 17,
    marginLeft: 6,
    fontWeight: '400',
  },
  rowValue: {
    marginLeft: 'auto',
    fontSize: 17,
    fontWeight: '400',
  },
});

export default ProfileScreen;