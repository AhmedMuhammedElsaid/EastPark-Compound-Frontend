import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';
import { communityApi } from '@/services/api/community';
import { shopsApi } from '@/services/api/shops';
import { useAppSelector } from '@/store';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

function greeting(h: number): string {
  if (h < 12)
    return 'home.greeting_morning';
  if (h < 18)
    return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(s => s.auth.user);
  const { requireAuthNavigation } = useAuthGuard();
  const isAr = i18n.language === 'ar';

  const greetKey = greeting(new Date().getHours());

  const { data: announcementsData, isLoading: annLoading } = useQuery({
    queryKey: ['home-announcements'],
    queryFn: () => communityApi.getAnnouncements({ limit: 3 }),
  });

  const { data: shopsData, isLoading: shopsLoading } = useQuery({
    queryKey: ['home-shops'],
    queryFn: () => shopsApi.getShops({ limit: 6 }),
  });

  const announcements = announcementsData?.data.data.data ?? [];
  const shops = shopsData?.data.data.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetText}>
            {t(greetKey)}
            {user ? `, ${user.name.split(' ')[0]}` : ''}
          </Text>
          {user && (
            <Text style={styles.unitText}>{t('checkout.unit', { number: user.unitNumber })}</Text>
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>{t('home.quick_actions')}</Text>
        <QuickActionsGrid requireAuthNavigation={requireAuthNavigation} />

        {/* What's new */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.whats_new')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/community' as any)}>
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </Pressable>
        </View>

        {annLoading
          ? <HomeSectionSkeleton />
          : <AnnouncementsPreview announcements={announcements} isAr={isAr} />}

        {/* Shops */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.shops')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/directory' as any)}>
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </Pressable>
        </View>

        {shopsLoading
          ? <HomeSectionSkeleton />
          : <ShopsGrid shops={shops} isAr={isAr} />}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '🏪', labelKey: 'home.shops', route: '/(tabs)/directory' },
  { icon: '📢', labelKey: 'home.community', route: '/(tabs)/community' },
  { icon: '🗳️', labelKey: 'governance.title', route: '/(tabs)/community/governance', authRequired: false },
  { icon: '📦', labelKey: 'home.my_orders', route: '/(tabs)/orders', authRequired: true },
  { icon: '💬', labelKey: 'home.feedback', route: '/(tabs)/community/feedback', authRequired: true },
  { icon: '📋', labelKey: 'community.reports', route: '/(tabs)/community/reports' },
] as const;

function QuickActionsGrid({ requireAuthNavigation }: { requireAuthNavigation: (href: string) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.quickGrid}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.route}
          style={styles.quickCard}
          onPress={() => {
            if ('authRequired' in action && action.authRequired)
              requireAuthNavigation(action.route);
            else router.push(action.route as any);
          }}
        >
          <Text style={styles.quickIcon}>{action.icon}</Text>
          <Text style={styles.quickLabel}>{t(action.labelKey as any)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AnnouncementsPreview({ announcements, isAr }: { announcements: any[]; isAr: boolean }) {
  if (!announcements.length)
    return null;
  return (
    <View style={styles.annList}>
      {announcements.map((ann) => {
        const title = isAr ? ann.titleAr : ann.title;
        return (
          <Pressable
            key={ann.id}
            style={styles.annCard}
            onPress={() => router.push(`/(tabs)/community/${ann.id}` as any)}
          >
            <Text style={styles.annCategory}>{ann.category}</Text>
            <Text style={styles.annTitle} numberOfLines={2}>{title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ShopsGrid({ shops, isAr }: { shops: any[]; isAr: boolean }) {
  if (!shops.length)
    return null;
  return (
    <View style={styles.shopsGrid}>
      {shops.map((shop) => {
        const name = isAr ? shop.nameAr : shop.name;
        const cover = shop.photos.find((p: any) => p.isPrimary) ?? shop.photos[0];
        return (
          <Pressable
            key={shop.id}
            style={styles.shopCard}
            onPress={() => router.push(`/(tabs)/directory/${shop.id}` as any)}
          >
            {cover
              ? <Image source={{ uri: cover.url }} style={styles.shopImg} resizeMode="cover" />
              : <View style={[styles.shopImg, { backgroundColor: DARK.elevated }]} />}
            <Text style={styles.shopName} numberOfLines={1}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeSectionSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
      <Skeleton width="48%" height={80} borderRadius={RADIUS.md} />
      <Skeleton width="48%" height={80} borderRadius={RADIUS.md} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  scroll: { padding: SPACING.base, gap: SPACING.lg },
  greeting: { gap: SPACING.xs },
  greetText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 26, color: DARK.text },
  unitText: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  seeAll: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard: {
    width: '30.5%',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    aspectRatio: 1,
    justifyContent: 'center',
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontFamily: FONT.sans, fontSize: 11, color: DARK.textMuted, textAlign: 'center', fontWeight: '500' },
  annList: { gap: SPACING.sm },
  annCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  annCategory: { fontFamily: FONT.sans, fontSize: 11, color: BRAND.gold, fontWeight: '600', textTransform: 'uppercase' },
  annTitle: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text, lineHeight: 20 },
  shopsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  shopCard: {
    width: '30.5%',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  shopImg: { width: '100%', aspectRatio: 1 },
  shopName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 12, color: DARK.text, padding: SPACING.xs },
});
