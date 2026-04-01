import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import { merchantApi } from '@/services/api/merchant';
import { DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function MerchantDashboard() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAr = i18n.language === 'ar';

  const { data: shopData, isLoading } = useQuery({
    queryKey: ['merchant-shop'],
    queryFn: () => merchantApi.getMyShop(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['merchant-orders', 'PLACED'],
    queryFn: () => merchantApi.getIncomingOrders({ status: 'PLACED', limit: 5 }),
    refetchInterval: 30000, // poll every 30s
  });

  const shop = shopData?.data.data;
  const pendingCount = ordersData?.data.data.data.length ?? 0;

  const { mutate: toggleOpen } = useMutation({
    mutationFn: (open: boolean) => merchantApi.toggleShopOpen(open),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-shop'] }),
  });

  if (isLoading || !shop)
    return <DashboardSkeleton insets={insets} />;

  const shopName = isAr ? shop.nameAr : shop.name;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('merchant.dashboard')}</Text>
          <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
        </View>
        <View style={styles.openRow}>
          <Text style={[styles.openLabel, { color: shop.isOpen ? SEMANTIC.success : DARK.textMuted }]}>
            {shop.isOpen ? t('common.open') : t('common.closed')}
          </Text>
          <Switch
            value={shop.isOpen}
            onValueChange={v => toggleOpen(v)}
            trackColor={{ true: SEMANTIC.success, false: DARK.elevated }}
            thumbColor={DARK.text}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        {pendingCount > 0 && (
          <Pressable style={styles.alertBanner} onPress={() => router.push('/(merchant)/orders' as any)}>
            <Text style={styles.alertIcon}>🔔</Text>
            <Text style={styles.alertText}>
              {pendingCount}
              {' '}
              new
              {pendingCount === 1 ? 'order' : 'orders'}
              {' '}
              waiting
            </Text>
            <Text style={styles.alertChevron}>›</Text>
          </Pressable>
        )}

        <View style={styles.quickActions}>
          <QuickActionCard
            icon="📋"
            label={t('merchant.orders')}
            onPress={() => router.push('/(merchant)/orders' as any)}
          />
          <QuickActionCard
            icon="🍽"
            label={t('merchant.menu')}
            onPress={() => router.push('/(merchant)/menu' as any)}
          />
          <QuickActionCard
            icon="🏪"
            label={t('merchant.shop_profile')}
            onPress={() => router.push(`/(tabs)/directory/${shop.id}` as any)}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Open" value={shop.isOpen ? t('common.open') : t('common.closed')} accent={shop.isOpen ? SEMANTIC.success : DARK.textMuted} />
          <StatCard label="Pending" value={String(pendingCount)} accent={pendingCount > 0 ? SEMANTIC.warning : DARK.textMuted} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickActionCard({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DashboardSkeleton({ insets }: { insets: { top: number } }) {
  return (
    <View style={styles.container}>
      <View style={{ height: insets.top + 80, backgroundColor: DARK.card }} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="100%" height={80} borderRadius={RADIUS.md} />
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <Skeleton width="30%" height={100} borderRadius={RADIUS.md} />
          <Skeleton width="30%" height={100} borderRadius={RADIUS.md} />
          <Skeleton width="30%" height={100} borderRadius={RADIUS.md} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  greeting: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  shopName: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 20, color: DARK.text },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  openLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13 },
  scroll: { padding: SPACING.base, gap: SPACING.md },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${SEMANTIC.warning}22`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: SEMANTIC.warning,
    gap: SPACING.sm,
  },
  alertIcon: { fontSize: 20 },
  alertText: { flex: 1, fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  alertChevron: { fontSize: 20, color: DARK.textMuted },
  quickActions: { flexDirection: 'row', gap: SPACING.md },
  quickCard: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted, textAlign: 'center', fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 22 },
  statLabel: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
});
