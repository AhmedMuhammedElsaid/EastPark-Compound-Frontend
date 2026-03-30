import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import type { MerchantOrder } from '@/services/api/merchant';
import { merchantApi } from '@/services/api/merchant';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

// Status pipeline for merchant actions
const NEXT_STATUS: Record<string, string | null> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'ON_THE_WAY',
  ON_THE_WAY: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

export default function MerchantOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-order', orderId],
    queryFn: () => merchantApi.getOrder(orderId),
    enabled: !!orderId,
    refetchInterval: 10000,
  });

  const order = data?.data.data;

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: string) => merchantApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
  });

  const { mutate: rejectOrder, isPending: rejecting } = useMutation({
    mutationFn: () => merchantApi.updateOrderStatus(orderId, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
      router.back();
    },
  });

  if (isLoading || !order) return <OrderDetailSkeleton insets={insets} />;

  const nextStatus = NEXT_STATUS[order.status];
  const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
  const time = new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.navInfo}>
          <Text style={styles.navUnit}>Unit {order.user.unitNumber}</Text>
          <Text style={styles.navName}>{order.user.name}</Text>
        </View>
        <Text style={styles.navTime}>{time}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <OrderStatusBadge status={order.status} />
        <OrderItemsList order={order} />
        <OrderMeta order={order} />

        {isActive && (
          <ActionButtons
            status={order.status}
            nextStatus={nextStatus}
            onAdvance={() => { if (nextStatus) updateStatus(nextStatus); }}
            onReject={() => rejectOrder()}
            isPending={isPending}
            isRejecting={rejecting}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const colors: Record<string, string> = {
    PLACED: SEMANTIC.info,
    CONFIRMED: SEMANTIC.info,
    PREPARING: SEMANTIC.warning,
    READY: SEMANTIC.success,
    ON_THE_WAY: BRAND.gold,
    DELIVERED: DARK.elevated,
    CANCELLED: SEMANTIC.error,
  };
  return (
    <View style={[styles.statusCard, { borderLeftColor: colors[status] ?? DARK.border }]}>
      <Text style={styles.statusLabel}>{t(`orders.${status}`)}</Text>
    </View>
  );
}

function OrderItemsList({ order }: { order: MerchantOrder }) {
  return (
    <View style={styles.itemsCard}>
      {order.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemQty}>{item.quantity}×</Text>
          <Text style={styles.itemName} numberOfLines={1}>{item.productNameSnapshot}</Text>
          <Text style={styles.itemPrice}>EGP {item.totalPrice.toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>EGP {order.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
}

function OrderMeta({ order }: { order: MerchantOrder }) {
  const { t } = useTranslation();
  return (
    <View style={styles.metaCard}>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>{t('checkout.payment')}</Text>
        <Text style={styles.metaValue}>{order.paymentMethod === 'CASH' ? t('checkout.cash') : t('checkout.card')}</Text>
      </View>
      {order.notes && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('checkout.notes')}</Text>
          <Text style={styles.metaValue}>{order.notes}</Text>
        </View>
      )}
    </View>
  );
}

function ActionButtons({
  status,
  nextStatus,
  onAdvance,
  onReject,
  isPending,
  isRejecting,
}: {
  status: string;
  nextStatus: string | null;
  onAdvance: () => void;
  onReject: () => void;
  isPending: boolean;
  isRejecting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.actions}>
      {status === 'PLACED' && (
        <Pressable
          style={[styles.rejectBtn, isRejecting && styles.btnDisabled]}
          onPress={onReject}
          disabled={isRejecting}
        >
          <Text style={styles.rejectBtnText}>{t('merchant.reject')}</Text>
        </Pressable>
      )}
      {nextStatus && (
        <Pressable
          style={[styles.acceptBtn, isPending && styles.btnDisabled]}
          onPress={onAdvance}
          disabled={isPending}
        >
          <Text style={styles.acceptBtnText}>
            {status === 'PLACED' ? t('merchant.accept') : t('merchant.update_status')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function OrderDetailSkeleton({ insets }: { insets: { top: number } }) {
  return (
    <View style={styles.container}>
      <View style={{ height: insets.top + 56, backgroundColor: DARK.card }} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="100%" height={60} borderRadius={RADIUS.md} />
        <Skeleton width="100%" height={140} borderRadius={RADIUS.md} />
        <Skeleton width="100%" height={80} borderRadius={RADIUS.md} />
      </View>
    </View>
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
    gap: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 16, color: DARK.text },
  navInfo: { flex: 1 },
  navUnit: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: BRAND.gold },
  navName: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  navTime: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  scroll: { padding: SPACING.base, gap: SPACING.md },
  statusCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.gold,
  },
  statusLabel: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text },
  itemsCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  itemQty: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 14, color: BRAND.gold, minWidth: 28 },
  itemName: { flex: 1, fontFamily: FONT.sans, fontSize: 14, color: DARK.text },
  itemPrice: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: DARK.border, paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.text },
  totalValue: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: BRAND.gold },
  metaCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  metaLabel: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  metaValue: { fontFamily: FONT.sans, fontSize: 13, color: DARK.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: SPACING.md },
  acceptBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: SEMANTIC.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.text },
  rejectBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: SEMANTIC.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: SEMANTIC.error },
  btnDisabled: { opacity: 0.5 },
});
