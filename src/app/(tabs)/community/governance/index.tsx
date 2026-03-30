import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/skeleton';
import type { Election, Poll } from '@/services/api/governance';
import { governanceApi } from '@/services/api/governance';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

export default function GovernanceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = React.useState<'polls' | 'elections'>('polls');

  const pollsQuery = useQuery({
    queryKey: ['polls'],
    queryFn: () => governanceApi.getPolls({ limit: 20 }),
  });

  const electionsQuery = useQuery({
    queryKey: ['elections'],
    queryFn: () => governanceApi.getElections({ limit: 20 }),
  });

  const polls = pollsQuery.data?.data.data.data ?? [];
  const elections = electionsQuery.data?.data.data.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('governance.title')}</Text>
      </View>

      <View style={styles.tabBar}>
        {(['polls', 'elections'] as const).map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {t(`governance.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tab === 'polls' && (
          <GovernanceList
            isLoading={pollsQuery.isLoading}
            empty={!polls.length}
            emptyText={t('governance.no_polls')}
          >
            {polls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
          </GovernanceList>
        )}
        {tab === 'elections' && (
          <GovernanceList
            isLoading={electionsQuery.isLoading}
            empty={!elections.length}
            emptyText={t('governance.no_elections')}
          >
            {elections.map((el) => <ElectionCard key={el.id} election={el} />)}
          </GovernanceList>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GovernanceList({
  isLoading,
  empty,
  emptyText,
  children,
}: {
  isLoading: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`gov-sk-${i}`} width="100%" height={96} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
        ))}
      </>
    );
  }
  if (empty) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🗳️</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function PollCard({ poll }: { poll: Poll }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const question = isAr ? poll.questionAr : poll.question;
  const expiry = new Date(poll.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable
      style={[styles.card, poll.myVote && styles.cardVoted]}
      onPress={() => router.push(`/(tabs)/community/governance/polls/${poll.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.pollBadge}>
          <Text style={styles.pollBadgeText}>{t('governance.polls')}</Text>
        </View>
        {poll.myVote && (
          <Text style={styles.votedBadge}>{t('governance.voted')}</Text>
        )}
      </View>
      <Text style={styles.cardQuestion} numberOfLines={3}>{question}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>{poll.totalVotes} votes</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{t('governance.expires', { date: expiry })}</Text>
      </View>
    </Pressable>
  );
}

function ElectionCard({ election }: { election: Election }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const title = isAr ? election.titleAr : election.title;
  const expiry = new Date(election.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable
      style={[styles.card, election.myVote && styles.cardVoted]}
      onPress={() => router.push(`/(tabs)/community/governance/elections/${election.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.pollBadge, styles.electionBadge]}>
          <Text style={styles.pollBadgeText}>{t('governance.elections')}</Text>
        </View>
        {election.myVote && (
          <Text style={styles.votedBadge}>{t('governance.voted')}</Text>
        )}
      </View>
      <Text style={styles.cardQuestion} numberOfLines={2}>{title}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>{election.candidates.length} {t('governance.candidates').toLowerCase()}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{t('governance.expires', { date: expiry })}</Text>
      </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  tab: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: BRAND.gold },
  tabText: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, fontWeight: '500' },
  tabTextActive: { color: BRAND.gold },
  scroll: { padding: SPACING.base },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted },
  card: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardVoted: { borderWidth: 1, borderColor: BRAND.gold },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pollBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: DARK.elevated,
  },
  electionBadge: { backgroundColor: BRAND.goldTint },
  pollBadgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  votedBadge: { fontFamily: FONT.sans, fontSize: 11, color: BRAND.gold, fontWeight: '600' },
  cardQuestion: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.text, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaText: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  metaDot: { fontSize: 12, color: DARK.textMuted },
});
