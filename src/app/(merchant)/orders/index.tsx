import type { AxiosResponse } from 'axios';
import type { MerchantOrder } from '@/services/api/merchant';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, InboxSimple } from 'phosphor-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatCurrency';
import { merchantApi } from '@/services/api/merchant';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const STATUS_FILTERS = ['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_COLOR: Record<string, string> = {
  PLACED: SEMANTIC.info,
  CONFIRMED: SEMANTIC.info,
  PREPARING: SEMANTIC.warning,
  READY: SEMANTIC.success,
  ON_THE_WAY: BRAND.gold,
  DELIVERED: DARK.elevated,
  CANCELLED: DARK.elevated,
};

export default function MerchantOrdersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = React.useState<StatusFilter>('ALL');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: MerchantOrder[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: MerchantOrder[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['merchant-orders', filter],
      queryFn: ({ pageParam }) =>
        merchantApi.getIncomingOrders({
          cursor: pageParam,
          limit: 20,
          status: filter === 'ALL' ? undefined : filter,
        }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
      refetchInterval: 15000, // poll every 15s for new orders
    });

  const orders = data?.pages.flatMap(p => p.data.data.data).filter(Boolean) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={18} color={DARK.text} />
        </Pressable>
        <Text style={styles.navTitle}>{t('merchant.orders')}</Text>
      </View>

      <StatusFilterBar filter={filter} onSelect={setFilter} />

      {isLoading
        ? (
            <View style={styles.loadingPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`morder-sk-${i}`} width="100%" height={104} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
              ))}
            </View>
          )
        : (
            <FlashList
              data={orders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <MerchantOrderCard order={item} />}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage)
                  fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              onRefresh={refetch}
              refreshing={false}
              ListEmptyComponent={(
                <View style={styles.empty}>
                  <InboxSimple size={48} color={DARK.textMuted} />
                  <Text style={styles.emptyText}>{t('common.no_results')}</Text>
                </View>
              )}
              ListFooterComponent={
                isFetchingNextPage ? <Skeleton width="100%" height={104} borderRadius={RADIUS.md} /> : null
              }
            />
          )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusFilterBar({ filter, onSelect }: { filter: StatusFilter; onSelect: (f: StatusFilter) => void }) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterBar}
      contentContainerStyle={styles.filterBarContent}
    >
      {STATUS_FILTERS.map((key) => {
        const active = filter === key;
        const label = key === 'ALL' ? t('directory.all_categories') : t(`orders.${key}`);
        return (
          <Pressable
            key={key}
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => onSelect(key)}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MerchantOrderCard({ order }: { order: MerchantOrder }) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLOR[order.status] ?? DARK.elevated;
  const time = new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(merchant)/orders/${order.id}` as any)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.unitLabel}>{t('checkout.unit', { number: order.user.unitNumber })}</Text>
          <Text style={styles.customerName}>{order.user.name}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{t(`orders.${order.status}`)}</Text>
          </View>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
      <Text style={styles.items} numberOfLines={1}>
        {order.items.map(item => `${item.quantity}× ${item.productNameSnapshot}`).join(', ')}
      </Text>
      <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  filterBar: {
    backgroundColor: DARK.bg,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  filterBarContent: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  filterChipActive: { backgroundColor: BRAND.gold, borderColor: BRAND.gold },
  filterChipText: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted, fontWeight: '500' },
  filterChipTextActive: { color: DARK.bg },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted },
  card: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  unitLabel: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 14, color: BRAND.gold },
  customerName: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  time: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  items: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  total: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.text },
});
