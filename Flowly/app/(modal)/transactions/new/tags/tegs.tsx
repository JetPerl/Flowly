import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useNavigation, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useTransactionDraft } from '../../../../../src/context/_TransactionDraftContext';
import { apiRequest } from '../../../../../src/api/client';

type TagDto = {
  id: number;
  name: string;
  color?: string | null;
};

const COLORS = {
  textMain: '#212121',
  textSecondary: '#757575',
  purple: '#2BAF8C',
};

export default function TransactionTagsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { draft, toggleTag } = useTransactionDraft();
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      headerSearchBarOptions: {
        placeholder: 'Поиск',
        placement: 'stacked',
        hideWhenScrolling: false,
        onChangeText: ({ nativeEvent }) => setSearch(nativeEvent.text),
        onCancelButtonPress: () => setSearch(''),
      },
    });
  }, [navigation]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTags = useMemo(() => {
    if (!normalizedSearch) return tags;
    return tags.filter(tag => tag.name.toLowerCase().includes(normalizedSearch));
  }, [tags, normalizedSearch]);

  const handleToggle = (tag: TagDto) => {
    toggleTag(tag);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Метки',
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.purple} />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 0 }}
        >
          {filteredTags.length === 0 ? (
            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ color: COLORS.textSecondary }}>Нет доступных меток</Text>
            </View>
          ) : (
            filteredTags.map(tag => {
              const isSelected = draft.tags.some(t => t.id === tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => handleToggle(tag)}
                >
                  <View style={styles.rowLeft}>
                    <FontAwesome6
                      name="tag"
                      size={18}
                      color={tag.color || '#D1D5DB'}
                    />
                    <Text style={styles.rowText}>{tag.name}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.purple}
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
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEFF1',
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
    color: COLORS.textMain,
  },
  rowRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
