import type { AxiosResponse } from 'axios';
import type { Announcement, AnnouncementCategory } from '@/services/api/community';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

type Filter = AnnouncementCategory | 'ALL';

const FILTERS: { key: Filter; i18nKey: string }[] = [
  { key: 'ALL', i18nKey: 'directory.all_categories' },
  { key: 'GENERAL', i18nKey: 'community.GENERAL' },
  { key: 'NEWS', i18nKey: 'community.NEWS' },
  { key: 'EVENT', i18nKey: 'community.EVENT' },
  { key: 'MAINTENANCE', i18nKey: 'community.MAINTENANCE' },
  { key: 'PROMOTION', i18nKey: 'community.PROMOTION' },
];

const CATEGORY_COLOR: Record<string, string> = {
  GENERAL: DARK.elevated,
  NEWS: SEMANTIC.info,
  EVENT: BRAND.gold,
  MAINTENANCE: SEMANTIC.warning,
  PROMOTION: SEMANTIC.success,
};

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { requireAuthNavigation } = useAuthGuard();
  const [filter, setFilter] = React.useState<Filter>('ALL');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: Announcement[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: Announcement[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['announcements', filter],
      queryFn: ({ pageParam }) =>
        communityApi.getAnnouncements({
          cursor: pageParam,
          limit: 15,
          category: filter === 'ALL' ? undefined : filter,
        }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const announcements = data?.pages.flatMap(p => p.data.data.data) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CommunityHeader
        onGovernance={() => router.push('/(tabs)/community/governance' as any)}
        onReports={() => router.push('/(tabs)/community/reports' as any)}
        onFeedback={() => requireAuthNavigation('/(tabs)/community/feedback')}
      />
      <FilterChips selected={filter} onSelect={setFilter} />
      <AnnouncementList
        announcements={announcements}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CommunityHeader({
  onGovernance,
  onReports,
  onFeedback,
}: {
  onGovernance: () => void;
  onReports: () => void;
  onFeedback: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('community.title')}</Text>
      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={onGovernance}>
          <Text style={styles.quickLinkIcon}>🗳️</Text>
          <Text style={styles.quickLinkLabel}>{t('community.governance')}</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={onReports}>
          <Text style={styles.quickLinkIcon}>📄</Text>
          <Text style={styles.quickLinkLabel}>{t('community.reports')}</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={onFeedback}>
          <Text style={styles.quickLinkIcon}>💬</Text>
          <Text style={styles.quickLinkLabel}>{t('community.feedback')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilterChips({ selected, onSelect }: { selected: Filter; onSelect: (f: Filter) => void }) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {FILTERS.map(({ key, i18nKey }) => {
        const active = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
              {t(i18nKey)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type ListProps = {
  announcements: Announcement[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

function AnnouncementList({ announcements, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch }: ListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <View style={styles.loadingPad}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`ann-sk-${i}`} width="100%" height={120} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }
  return (
    <FlashList
      data={announcements}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <AnnouncementCard announcement={item} />}
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
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={styles.emptyTitle}>{t('community.no_announcements')}</Text>
        </View>
      )}
      ListFooterComponent={
        isFetchingNextPage
          ? <Skeleton width="100%" height={120} borderRadius={RADIUS.md} />
          : null
      }
    />
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const title = isAr ? announcement.titleAr : announcement.title;
  const body = isAr ? announcement.bodyAr : announcement.body;
  const catColor = CATEGORY_COLOR[announcement.category] ?? DARK.elevated;

  return (
    <Pressable
      style={[styles.card, announcement.isPinned && styles.cardPinned]}
      onPress={() => router.push(`/(tabs)/community/${announcement.id}` as any)}
    >
      <View style={styles.cardTop}>
        <View style={[styles.catBadge, { backgroundColor: catColor }]}>
          <Text style={styles.catBadgeText}>{t(`community.${announcement.category}`)}</Text>
        </View>
        {announcement.isPinned && (
          <Text style={styles.pinLabel}>{t('community.pinned')}</Text>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.cardBody} numberOfLines={3}>{body}</Text>
      {announcement.pdfUrl && (
        <Text style={styles.pdfLink}>{t('community.view_pdf')}</Text>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 24, color: DARK.text, marginBottom: SPACING.md },
  quickLinks: { flexDirection: 'row', gap: SPACING.sm },
  quickLink: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickLinkIcon: { fontSize: 22 },
  quickLinkLabel: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted, textAlign: 'center', fontWeight: '500' },
  chips: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.sm },
  chip: { height: 34, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, justifyContent: 'center' },
  chipActive: { backgroundColor: BRAND.gold },
  chipInactive: { borderWidth: 1, borderColor: DARK.border },
  chipLabel: { fontFamily: FONT.sans, fontWeight: '500', fontSize: 13 },
  chipLabelActive: { color: DARK.bg },
  chipLabelInactive: { color: DARK.textMuted },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: FONT.sans, fontSize: 16, color: DARK.textMuted, fontWeight: '600' },
  card: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  cardPinned: { borderWidth: 1, borderColor: BRAND.gold },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  catBadgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  pinLabel: { fontFamily: FONT.sans, fontSize: 11, color: BRAND.gold, fontWeight: '600' },
  cardTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.text, lineHeight: 22 },
  cardBody: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, lineHeight: 20 },
  pdfLink: { fontFamily: FONT.sans, fontSize: 12, color: BRAND.gold, fontWeight: '600', marginTop: SPACING.xs },
});
