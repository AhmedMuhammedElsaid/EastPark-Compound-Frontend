import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/directory/category-chips';
import { ShopCard } from '@/components/directory/shop-card';
import { ShopCardSkeleton } from '@/components/ui/skeleton';
import type { CursorPage, Shop, ShopCategory } from '@/services/api/shops';
import { shopsApi } from '@/services/api/shops';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

type Category = ShopCategory | 'ALL';

const PAGE_LIMIT = 20;

export default function DirectoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<Category>('ALL');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // 300ms debounce for search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery<
      AxiosResponse<{ data: CursorPage<Shop> }>,
      Error,
      { pages: AxiosResponse<{ data: CursorPage<Shop> }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['shops', category, debouncedSearch],
      queryFn: ({ pageParam }) =>
        shopsApi.getShops({
          cursor: pageParam,
          limit: PAGE_LIMIT,
          category: category === 'ALL' ? undefined : category,
          search: debouncedSearch || undefined,
        }),
      getNextPageParam: (last) => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const shops = data?.pages.flatMap((p) => p.data.data.data) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('directory.search_placeholder')}
          placeholderTextColor={DARK.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <CategoryChips selected={category} onSelect={setCategory} />

      {/* Shop list */}
      {isLoading
        ? (
            <View style={styles.listPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <ShopCardSkeleton key={`card-skeleton-${i}`} />
              ))}
            </View>
          )
        : (
            <FlashList
              data={shops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ShopCard shop={item} />}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              onRefresh={refetch}
              refreshing={false}
              ListEmptyComponent={<EmptyState search={debouncedSearch} />}
              ListFooterComponent={isFetchingNextPage ? <ShopCardSkeleton /> : null}
            />
          )}
    </View>
  );
}

function EmptyState({ search }: { search: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🏪</Text>
      <Text style={styles.emptyTitle}>
        {search ? t('common.no_results') : t('directory.no_shops')}
      </Text>
      <Text style={styles.emptyBody}>
        {t('directory.no_shops_subtitle')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.full,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontFamily: FONT.sans,
    fontSize: 15,
    color: DARK.text,
    height: '100%',
  },
  clearBtn: { fontSize: 14, color: DARK.textMuted },
  listPad: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  listContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text, textAlign: 'center' },
  emptyBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center', lineHeight: 22 },
});
