import React from 'react';
import { router, Stack } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionDraft } from './../_TransactionDraftContext';
import { HEADER_SAVE_EVENT } from './../_utils';

if (Platform.OS === 'ios' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OperationTypeTabs = () => {
  const { draft, setType } = useTransactionDraft();

  const handleChangeType = (type: 'income' | 'expense' | 'transfer') => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        180,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setType(type);
  };

  return (
    <View style={styles.operationTypeTabs}>
      {(['income', 'expense', 'transfer'] as const).map(type => (
        <TouchableOpacity
          key={type}
          activeOpacity={0.8}
          onPress={() => handleChangeType(type)}
          style={styles.operationTypeTab}
        >
          <Text
            style={[
              styles.operationTypeTabText,
              draft.type === type && styles.operationTypeTabTextActive,
            ]}
          >
            {type === 'expense' ? 'Расход' : type === 'income' ? 'Доход' : 'Перевод'}
          </Text>
          <View
            style={[
              styles.operationTypeTabUnderline,
              draft.type === type && styles.operationTypeTabUnderlineActive,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function IndexLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerLargeTitle: false,
        headerShown: true,
        headerTransparent: true,
        headerTitle: () => <OperationTypeTabs />,
        // iOS native navigation style

        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          >
            <Ionicons
              name="close-outline"
              size={33}
              color="black"
            />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => DeviceEventEmitter.emit(HEADER_SAVE_EVENT)}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          >
            <Ionicons
              name="checkmark-outline"
              size={32}
              color="black"
            />
          </Pressable>
          
        ),
      }}
      initialRouteName="index"
    />
  );
}

const styles = StyleSheet.create({
  operationTypeTabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 12,
  },
  operationTypeTab: {
    alignItems: 'center',
  },
  operationTypeTabText: {
    fontSize: 16,
    color: '#9AA5B1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  operationTypeTabTextActive: {
    color: '#2BAF8C',
  },
  operationTypeTabUnderline: {
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  operationTypeTabUnderlineActive: {
    backgroundColor: '#2BAF8C',
  },
});
