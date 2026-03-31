import type { AxiosResponse } from 'axios';
import type { Order, OrderStatus } from '@/services/api/orders';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ordersApi } from '@/services/api/orders';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const STATUS_COLOR: Record<OrderStatus, string> = {
  PLACED: SEMANTIC.info,
  CONFIRMED: SEMANTIC.info,
  PREPARING: SEMANTIC.warning,
  READY: SEMANTIC.warning,
  ON_THE_WAY: BRAND.gold,
  DELIVERED: SEMANTIC.success,
  CANCELLED: DARK.elevated,
};

export default function OrdersScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAr = i18n.language === 'ar';

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, isLoading, isRefetching, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: Order[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: Order[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['orders'],
      queryFn: ({ pageParam }) => ordersApi.getOrders({ cursor: pageParam, limit: 20 }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const orders = data?.pages.flatMap(p => p.data.data.data) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
      </View>

      {isError
        ? <ErrorState onRetry={refetch} />
        : isLoading
        ? (
            <View style={styles.loadingPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`order-sk-${i}`} width="100%" height={96} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
              ))}
            </View>
          )
        : (
            <FlashList
              data={orders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <OrderCard order={item} isAr={isAr} />}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage)
                  fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              onRefresh={refetch}
              refreshing={isRefetching}
              ListEmptyComponent={<EmptyOrders />}
              ListFooterComponent={
                isFetchingNextPage
                  ? <Skeleton width="100%" height={96} borderRadius={RADIUS.md} />
                  : null
              }
            />
          )}
    </View>
  );
}

function OrderCard({ order, isAr }: { order: Order; isAr: boolean }) {
  const { t } = useTranslation();
  const shopName = isAr ? order.shop.nameAr : order.shop.name;
  const statusColor = STATUS_COLOR[order.status] ?? DARK.elevated;
  const date = new Date(order.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(tabs)/orders/${order.id}` as any)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{t(`orders.${order.status}`)}</Text>
        </View>
      </View>
      <Text style={styles.items} numberOfLines={1}>
        {order.items.map(item => (isAr ? item.productNameArSnapshot : item.productNameSnapshot)).join(', ')}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={styles.total}>
          EGP
          {order.totalAmount.toFixed(2)}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </Pressable>
  );
}

function EmptyOrders() {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
      <Text style={styles.emptyBody}>{t('orders.empty_subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  header: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.md },
  headerTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 24, color: DARK.text },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base },
  card: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  shopName: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  items: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: BRAND.gold },
  date: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text, textAlign: 'center' },
  emptyBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center', lineHeight: 22 },
});
