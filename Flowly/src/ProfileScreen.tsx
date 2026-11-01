import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAvatar } from './avatar/AvatarContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMainCurrency } from './currency/CurrencyContext';

const ProfileScreen = () => {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.9}
            onPress={openAvatarAlert}
          >
            <Image source={avatarSource} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.userName}>Eliasz Burnas</Text>
          <Text style={styles.userEmail}>ilyaburnas@gmail.com</Text>
        </View>

        <View style={styles.listSection}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/currency-list')}>
            <MaterialIcons name="currency-exchange" size={22} style={styles.switchIcon} />
            <Text style={styles.rowText}>Основная валюта</Text>
            <Text style={styles.rowValue}>{mainCurrency?.toUpperCase()}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/edit-profile')}>
            <Text style={styles.switchIcon}>👤</Text>
            <Text style={styles.rowText}>Личная информация</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/security')}>
            <MaterialCommunityIcons name="shield-check" size={22} style={styles.switchIcon} />
            <Text style={styles.rowText}>Вход и безопасность</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>🔔</Text>
            <Text style={styles.rowText}>Напоминания</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>💬</Text>
            <Text style={styles.rowText}>Язык приложения</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>❓</Text>
            <Text style={styles.rowText}>Помощь</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>🔔</Text>
            <Text style={styles.rowText}>Включить синхронизацию</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>㊢</Text>
            <Text style={styles.rowText}>Резервные копии</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>🔔</Text>
            <Text style={styles.rowText}>Экспорт</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>㊢</Text>
            <Text style={styles.rowText}>Импорт</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>👥</Text>
            <Text style={styles.rowText}>Выйти</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.switchIcon}>👥</Text>
            <Text style={styles.rowText}>Сменить пользователя</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderColor: '#f5f7f9',
    backgroundColor: '#fff',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    marginTop: 110,
    fontSize: 20,
    fontWeight: '600',
    color: '#0f0f0f',
  },
  userEmail: {
    marginTop: 6,
    fontSize: 14,
    color: '#555',
  },
  listSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e6e8',
    marginLeft: 56, // align with text start (16 padding + 34 icon width + 6 gap)
    marginRight: 16,
  },
  switchIcon: {
    fontSize: 22,
    width: 34,
    color: '#555',
    textAlign: 'center',
  },
  rowText: {
    fontSize: 17,
    color: '#0f0f0f',
    marginLeft: 6,
    fontWeight: '400',
  },
  rowValue: {
    marginLeft: 'auto',
    fontSize: 17,
    color: '#6b7280',
    fontWeight: '400',
  },
});

export default ProfileScreen;
