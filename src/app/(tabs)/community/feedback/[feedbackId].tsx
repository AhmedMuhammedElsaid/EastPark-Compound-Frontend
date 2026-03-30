import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackStatus } from '@/services/api/community';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const STATUS_COLOR: Record<FeedbackStatus, string> = {
  SUBMITTED: DARK.elevated,
  ACKNOWLEDGED: SEMANTIC.info,
  IN_PROGRESS: SEMANTIC.warning,
  RESOLVED: SEMANTIC.success,
};

export default function FeedbackDetailScreen() {
  const { feedbackId } = useLocalSearchParams<{ feedbackId: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['feedback', feedbackId],
    queryFn: () => communityApi.getFeedbackItem(feedbackId),
    enabled: !!feedbackId,
  });

  const fb = data?.data.data;

  if (isLoading || !fb) return <FeedbackDetailSkeleton insets={insets} />;

  const date = new Date(fb.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('feedback.title')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <FeedbackMeta feedback={fb} date={date} />
        <View style={styles.divider} />

        {fb.replies.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('feedback.reply')}</Text>
            {fb.replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedbackMeta({ feedback, date }: { feedback: any; date: string }) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLOR[feedback.status as FeedbackStatus] ?? DARK.elevated;

  return (
    <View style={styles.metaSection}>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: DARK.elevated }]}>
          <Text style={styles.badgeText}>{t(`feedback.${feedback.category}`)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{t(`feedback.${feedback.status}`)}</Text>
        </View>
        {feedback.isAnonymous && (
          <View style={[styles.badge, { backgroundColor: DARK.elevated }]}>
            <Text style={styles.badgeText}>{t('feedback.anonymous')}</Text>
          </View>
        )}
      </View>
      <Text style={styles.fbTitle}>{feedback.title}</Text>
      <Text style={styles.fbBody}>{feedback.body}</Text>
      <Text style={styles.fbDate}>{date}</Text>
    </View>
  );
}

function ReplyCard({ reply }: { reply: any }) {
  const date = new Date(reply.createdAt).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.replyCard}>
      <View style={styles.replyHeader}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
        {reply.author && (
          <Text style={styles.replyAuthor}>{reply.author.name}</Text>
        )}
        <Text style={styles.replyDate}>{date}</Text>
      </View>
      <Text style={styles.replyBody}>{reply.body}</Text>
    </View>
  );
}

function FeedbackDetailSkeleton({ insets }: { insets: { top: number } }) {
  return (
    <View style={styles.container}>
      <View style={{ height: insets.top + 56, backgroundColor: DARK.card }} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="40%" height={20} />
        <Skeleton width="80%" height={24} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} />
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
    gap: SPACING.sm,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
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
  navTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  scroll: { padding: SPACING.base },
  metaSection: { gap: SPACING.sm, marginBottom: SPACING.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 12, color: DARK.text },
  fbTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 20, color: DARK.text, lineHeight: 28 },
  fbBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 24 },
  fbDate: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  divider: { height: 1, backgroundColor: DARK.border, marginVertical: SPACING.lg },
  sectionTitle: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 16,
    color: DARK.text,
    marginBottom: SPACING.md,
  },
  replyCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.gold,
    marginBottom: SPACING.md,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  adminBadge: {
    backgroundColor: BRAND.goldTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  adminBadgeText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 11, color: BRAND.goldText },
  replyAuthor: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.text, flex: 1 },
  replyDate: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  replyBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22 },
});
