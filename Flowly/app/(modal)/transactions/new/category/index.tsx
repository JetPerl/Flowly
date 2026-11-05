import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useNavigation, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import CategoryIcon from '../../../../../src/components/CategoryIcon';
import { useTransactionDraft } from '../../../../../src/context/_TransactionDraftContext';
import { apiRequest } from '../../../../../src/api/client';

type IncomeCategoryDto = {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
};

type ExpenseCategoryChildDto = {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
};

type ExpenseCategoryDto = {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  children?: ExpenseCategoryChildDto[];
};

type CategoryDto = {
  id: number;
  name: string;
  type?: 'INCOME' | 'EXPENSE';
  icon?: string | null;
  color?: string | null;
};

const COLORS = {
  textMain: '#212121',
  textSecondary: '#757575',
  purple: '#2BAF8C',
  border: '#ECEFF1',
};

export default function TransactionCategoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { draft, setCategory, setType } = useTransactionDraft();

  const [incomeCategories, setIncomeCategories] = useState<IncomeCategoryDto[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>(
    draft.type === 'income' ? 'income' : 'expense',
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [incomeData, expenseData] = await Promise.all([
          apiRequest<CategoryDto[]>('/categories?type=INCOME').catch(() => []),
          apiRequest<CategoryDto[]>('/categories?type=EXPENSE').catch(() => []),
        ]);

        if (Array.isArray(incomeData)) {
          setIncomeCategories(
            incomeData.map(c => ({
              id: c.id,
              name: c.name,
              color: c.color,
              icon: c.icon,
            })),
          );
        }

        if (Array.isArray(expenseData)) {
          // Если категории плоские (без иерархии вложенности)
          setExpenseCategories(
            expenseData.map(c => ({
              id: c.id,
              name: c.name,
              color: c.color,
              icon: c.icon,
              children: [],
            })),
          );
        }
      } catch (e) {
        console.warn('Load categories error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const incomeToShow = useMemo(
    () =>
      normalizedSearch
        ? incomeCategories.filter(cat =>
            cat.name.toLowerCase().includes(normalizedSearch),
          )
        : incomeCategories,
    [incomeCategories, normalizedSearch],
  );

  const expenseFiltered = useMemo(() => {
    if (!normalizedSearch) {
      return expenseCategories;
    }
    return expenseCategories
      .map(group => {
        const matchesGroup = group.name.toLowerCase().includes(normalizedSearch);
        const matchedChildren = (group.children || []).filter(child =>
          child.name.toLowerCase().includes(normalizedSearch),
        );
        if (matchesGroup && matchedChildren.length === 0) {
          return group;
        }
        if (matchedChildren.length > 0) {
          return { ...group, children: matchedChildren };
        }
        return matchesGroup ? group : null;
      })
      .filter(Boolean) as ExpenseCategoryDto[];
  }, [expenseCategories, normalizedSearch]);

  const isIncome = categoryType === 'income';

  useEffect(() => {
    setCategoryType(draft.type === 'income' ? 'income' : 'expense');
  }, [draft.type]);

  const handleTypeChange = (next: 'income' | 'expense') => {
    if (next === categoryType) return;
    setCategoryType(next);
    setType(next);
    setCategory(undefined);
  };

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

  const handleSelect = (
    name: string,
    id: number,
    icon?: string | null,
    color?: string | null,
    parentName?: string | null,
  ) => {
    setCategory({ id, name, icon, color, parentName });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Категория',
          presentation: 'modal',
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.purple} />
        </View>
      ) : (
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        >
          {isIncome ? (
            incomeToShow.map(cat => {
              const selected = draft.category?.id === cat.id;
              return (
                <Animated.View key={cat.id}>
                  <TouchableOpacity
                    style={styles.sheetItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(cat.name, cat.id, cat.icon, cat.color)}
                  >
                    <View style={styles.sheetItemLeft}>
                      <CategoryIcon
                        name={cat.icon || 'wallet'}
                        color={cat.color || undefined}
                        backgroundColor="transparent"
                        size={30}
                      />
                      <Text style={styles.sheetItemText}>{cat.name}</Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.purple} />
                    ) : null}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            expenseFiltered.map(group => {
              const hasChildren = (group.children || []).length > 0;
              const parentSelected = draft.category?.id === group.id;
              return (
                <Animated.View key={group.id}>
                  <TouchableOpacity
                    style={styles.sheetItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(group.name, group.id, group.icon, group.color)}
                  >
                    <View style={styles.sheetItemLeft}>
                      <CategoryIcon
                        name={group.icon || 'wallet'}
                        color={group.color || undefined}
                        backgroundColor="transparent"
                        size={30}
                      />
                      <Text style={styles.sheetItemText}>{group.name}</Text>
                    </View>
                    {parentSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.purple} />
                    ) : null}
                  </TouchableOpacity>

                  {hasChildren &&
                    (group.children || []).map(child => {
                      const selected = draft.category?.id === child.id;
                      return (
                        <Animated.View key={child.id}>
                          <TouchableOpacity
                            style={[styles.sheetItem, styles.childItem]}
                            activeOpacity={0.7}
                            onPress={() =>
                              handleSelect(
                                child.name,
                                child.id,
                                child.icon,
                                child.color,
                                group.name,
                              )
                            }
                          >
                            <View style={styles.sheetItemLeft}>
                              <CategoryIcon
                                name={child.icon || group.icon || 'wallet'}
                                color={child.color || group.color || undefined}
                                backgroundColor="transparent"
                                size={28}
                              />
                              <Text style={styles.sheetItemText}>{child.name}</Text>
                            </View>
                            {selected ? (
                              <Ionicons name="checkmark-circle" size={24} color={COLORS.purple} />
                            ) : null}
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                </Animated.View>
              );
            })
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F7F7F9',
    marginBottom: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sheetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetItemText: {
    fontSize: 17,
    color: COLORS.textMain,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 6,
  },
  childItem: {
    paddingLeft: 54,
  },
});
