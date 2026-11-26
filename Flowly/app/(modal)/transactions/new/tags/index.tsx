import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useNavigation } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useTransactionDraft } from '../../../../../src/context/_TransactionDraftContext';
import { apiRequest } from '../../../../../src/api/client';
import { useThemeColors } from '../../../../../src/theme/useThemeColors';

type TagDto = {
  id: number;
  name: string;
  color?: string | null;
};

const DEFAULT_ACCENT = '#2BAF8C';

export default function TransactionTagsScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { draft, toggleTag } = useTransactionDraft();
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const accentColor = colors.income || DEFAULT_ACCENT;
  const defaultTagColor = colors.isDark ? '#64748B' : '#D1D5DB';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<TagDto[]>('/tags');
        if (Array.isArray(data)) {
          setTags(
            data.map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color,
            })),
          );
        }
      } catch (e) {
        console.warn('Load tags error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTintColor: colors.textMain,
      headerTitleStyle: { color: colors.textMain },
      headerSearchBarOptions: {
        placeholder: 'Поиск',
        placement: 'stacked',
        hideWhenScrolling: false,
        textColor: colors.textMain,
        headerIconColor: colors.textSecondary,
        hintTextColor: colors.textSecondary,
        onChangeText: ({ nativeEvent }: any) => setSearch(nativeEvent.text),
        onCancelButtonPress: () => setSearch(''),
      },
    });
  }, [navigation, colors.textMain, colors.textSecondary]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTags = useMemo(() => {
    if (!normalizedSearch) return tags;
    return tags.filter(tag => tag.name.toLowerCase().includes(normalizedSearch));
  }, [tags, normalizedSearch]);

  const handleToggle = (tag: TagDto) => {
    toggleTag(tag);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.baseSurface }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          title: 'Метки',
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
        >
          {filteredTags.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Нет доступных меток
              </Text>
            </View>
          ) : (
            filteredTags.map(tag => {
              const isSelected = draft.tags.some(t => t.id === tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.row, { borderBottomColor: colors.divider }]}
                  activeOpacity={0.7}
                  onPress={() => handleToggle(tag)}
                >
                  <View style={styles.rowLeft}>
                    <FontAwesome6
                      name="tag"
                      size={18}
                      color={tag.color || defaultTagColor}
                    />
                    <Text style={[styles.rowText, { color: colors.textMain }]}>
                      {tag.name}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={accentColor}
                      style={{ opacity: isSelected ? 1 : 0 }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 17,
  },
  rowRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});