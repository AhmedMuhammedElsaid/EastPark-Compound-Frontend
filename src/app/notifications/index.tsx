import type { AxiosResponse } from 'axios';
import type { AppNotification } from '@/services/api/notifications';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ArrowLeft, Bell } from 'phosphor-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/services/api/notifications';
import { useAppSelector } from '@/store';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isRefetching, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: AppNotification[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: AppNotification[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['notifications'],
      queryFn: ({ pageParam }) =>
        notificationsApi.getNotifications({ cursor: pageParam, limit: 25 }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
      enabled: isAuthenticated,
    });

  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const notifications = data?.pages.flatMap(p => p.data.data.data) ?? [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  function handleNotificationPress(notification: AppNotification) {
    markRead(notification.id);
    const d = notification.data as Record<string, string>;
    switch (notification.type) {
      case 'ORDER_UPDATE':
        if (d.orderId) router.push(`/(tabs)/orders/${d.orderId}` as any);
        break;
      case 'ANNOUNCEMENT':
        if (d.announcementId) router.push(`/(tabs)/community/${d.announcementId}` as any);
        break;
      case 'POLL':
        if (d.pollId) router.push(`/(tabs)/community/governance/polls/${d.pollId}` as any);
        break;
      case 'ELECTION':
        if (d.electionId) router.push(`/(tabs)/community/governance/elections/${d.electionId}` as any);
        break;
      case 'FEEDBACK_REPLY':
        if (d.feedbackId) router.push(`/(tabs)/community/feedback/${d.feedbackId}` as any);
        break;
      default:
        break;
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={18} color={DARK.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            style={[styles.markAllBtn, markingAll && styles.markAllBtnDisabled]}
            onPress={() => markAllRead()}
            disabled={markingAll}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.mark_all_read')}
          >
            <Text style={styles.markAllText}>{t('notifications.mark_all_read')}</Text>
          </Pressable>
        )}
      </View>

      {isLoading
        ? <NotificationsSkeleton />
        : (
            <FlashList
              data={notifications}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <NotificationItem notification={item} onPress={() => handleNotificationPress(item)} />
              )}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              onRefresh={refetch}
              refreshing={isRefetching}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<EmptyState />}
              ListFooterComponent={
                isFetchingNextPage
                  ? <Skeleton width="100%" height={72} borderRadius={RADIUS.md} style={{ marginTop: SPACING.sm }} />
                  : null
              }
            />
          )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const timeAgo = formatRelativeTime(notification.createdAt, t);
  const typeColor = TYPE_COLOR[notification.type] ?? DARK.textMuted;

  return (
    <Pressable
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
    >
      <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.cardTime}>{timeAgo}</Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>{notification.body}</Text>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Bell size={48} color={DARK.textMuted} />
      <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
    </View>
  );
}

function NotificationsSkeleton() {
  return (
    <View style={styles.skeletonPad}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={`notif-sk-${i}`} width="100%" height={72} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
      ))}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  ORDER_UPDATE: BRAND.gold,
  ANNOUNCEMENT: SEMANTIC.info,
  POLL: SEMANTIC.success,
  ELECTION: SEMANTIC.warning,
  FEEDBACK_REPLY: SEMANTIC.info,
  GENERAL: DARK.textMuted,
};

function formatRelativeTime(iso: string, t: (key: string, opts?: object) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.time_now');
  if (mins < 60) return t('notifications.time_minutes', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('notifications.time_hours', { count: hrs });
  const days = Math.floor(hrs / 24);
  return t('notifications.time_days', { count: days });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  header: {
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  headerTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  unreadBadge: {
    backgroundColor: BRAND.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 11, color: DARK.bg },
  markAllBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  markAllBtnDisabled: { opacity: 0.4 },
  markAllText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 12, color: BRAND.gold },
  listContent: { padding: SPACING.base },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  cardUnread: { backgroundColor: DARK.elevated },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  cardTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  cardTime: { fontFamily: FONT.sans, fontSize: 11, color: DARK.textMuted, flexShrink: 0 },
  cardBody: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.gold,
    marginTop: 5,
    flexShrink: 0,
  },
  empty: { alignItems: 'center', paddingTop: 100, gap: SPACING.md },
  emptyText: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted },
  skeletonPad: { padding: SPACING.base },
});
