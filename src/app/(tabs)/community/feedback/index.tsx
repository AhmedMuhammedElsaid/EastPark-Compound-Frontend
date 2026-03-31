import type { AxiosResponse } from 'axios';
import type { Feedback, FeedbackStatus } from '@/services/api/community';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const STATUS_COLOR: Record<FeedbackStatus, string> = {
  SUBMITTED: DARK.elevated,
  ACKNOWLEDGED: SEMANTIC.info,
  IN_PROGRESS: SEMANTIC.warning,
  RESOLVED: SEMANTIC.success,
};

export default function FeedbackListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isRefetching, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: Feedback[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: Feedback[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['my-feedback'],
      queryFn: ({ pageParam }) => communityApi.getFeedback({ cursor: pageParam, limit: 20 }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const items = data?.pages.flatMap(p => p.data.data.data) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('feedback.title')}</Text>
        <Pressable style={styles.newBtn} onPress={() => router.push('/(tabs)/community/feedback/new' as any)}>
          <Text style={styles.newBtnText}>+</Text>
        </Pressable>
      </View>

      {isLoading
        ? (
            <View style={styles.loadingPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`fb-sk-${i}`} width="100%" height={88} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
              ))}
            </View>
          )
        : (
            <FlashList
              data={items}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <FeedbackRow feedback={item} />}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage)
                  fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              onRefresh={refetch}
              refreshing={isRefetching}
              ListEmptyComponent={<FeedbackEmpty />}
              ListFooterComponent={
                isFetchingNextPage
                  ? <Skeleton width="100%" height={88} borderRadius={RADIUS.md} />
                  : null
              }
            />
          )}
    </View>
  );
}

function FeedbackRow({ feedback }: { feedback: Feedback }) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLOR[feedback.status] ?? DARK.elevated;
  const date = new Date(feedback.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/(tabs)/community/feedback/${feedback.id}` as any)}
    >
      <View style={styles.rowTop}>
        <View style={[styles.catBadge, { backgroundColor: DARK.elevated }]}>
          <Text style={styles.catBadgeText}>{t(`feedback.${feedback.category}`)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{t(`feedback.${feedback.status}`)}</Text>
        </View>
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>{feedback.title}</Text>
      <View style={styles.rowMeta}>
        <Text style={styles.rowDate}>{date}</Text>
        {feedback.replies.length > 0 && (
          <Text style={styles.replyBadge}>
            💬
            {feedback.replies.length}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function FeedbackEmpty() {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📩</Text>
      <Text style={styles.emptyTitle}>{t('feedback.empty')}</Text>
      <Text style={styles.emptyBody}>{t('feedback.empty_subtitle')}</Text>
    </View>
  );
}

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
  backIcon: { fontSize: 16, color: DARK.text },
  navTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBtnText: { fontSize: 22, color: DARK.bg, lineHeight: 26 },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base },
  row: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  rowTop: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  catBadgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusBadgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  rowTitle: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rowDate: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  replyBadge: { fontFamily: FONT.sans, fontSize: 12, color: BRAND.gold },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text, textAlign: 'center' },
  emptyBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center', lineHeight: 22 },
});
