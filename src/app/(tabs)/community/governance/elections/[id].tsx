import type { Candidate } from '@/services/api/governance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';
import { governanceApi } from '@/services/api/governance';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

export default function ElectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { requireAuth } = useAuthGuard();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => governanceApi.getElection(id),
    enabled: !!id,
  });

  const election = data?.data.data;
  const isAr = i18n.language === 'ar';

  const { mutate, isPending } = useMutation({
    mutationFn: (candidateId: string) => governanceApi.voteElection(id, candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election', id] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });

  function handleVote(candidateId: string, candidateName: string) {
    requireAuth(() => {
      Alert.alert(
        t('governance.vote'),
        t('governance.vote_confirm', { option: candidateName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('governance.vote'), onPress: () => mutate(candidateId) },
        ],
      );
    });
  }

  if (isLoading || !election)
    return <ElectionSkeleton insets={insets} />;

  const title = isAr ? election.titleAr : election.title;
  const description = isAr ? election.descriptionAr : election.description;
  const showVotes = election.resultsOpen && election.myVote !== null;
  const maxVotes = Math.max(...election.candidates.map(c => c.votes ?? 0), 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('governance.elections')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}

        {election.myVote && !showVotes && (
          <View style={styles.sealedBanner}>
            <Text style={styles.sealedText}>{t('governance.sealed')}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('governance.candidates')}</Text>

        <CandidateList
          candidates={election.candidates}
          isAr={isAr}
          myVote={election.myVote}
          showVotes={showVotes}
          maxVotes={maxVotes}
          onVote={handleVote}
          isPending={isPending}
        />

        <Text style={styles.meta}>
          {election.totalVotes}
          {' '}
          votes ·
          {' '}
          {t('governance.expires', {
            date: new Date(election.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
              month: 'short',
              day: 'numeric',
            }),
          })}
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CandidateList({
  candidates,
  isAr,
  myVote,
  showVotes,
  maxVotes,
  onVote,
  isPending,
}: {
  candidates: Candidate[];
  isAr: boolean;
  myVote: string | null;
  showVotes: boolean;
  maxVotes: number;
  onVote: (id: string, name: string) => void;
  isPending: boolean;
}) {
  return (
    <View style={styles.candidates}>
      {candidates.map((candidate) => {
        const name = isAr ? candidate.nameAr : candidate.name;
        const statement = isAr ? candidate.statementAr : candidate.statement;
        const isSelected = myVote === candidate.id;
        const pct = showVotes && candidate.votes !== undefined
          ? Math.round((candidate.votes / maxVotes) * 100)
          : 0;

        return (
          <CandidateCard
            key={candidate.id}
            name={name}
            statement={statement}
            photoUrl={candidate.photoUrl}
            isSelected={isSelected}
            canVote={!myVote}
            showVotes={showVotes}
            votes={candidate.votes}
            pct={pct}
            onVote={() => {
              if (!myVote && !isPending)
                onVote(candidate.id, name);
            }}
          />
        );
      })}
    </View>
  );
}

function CandidateCard({
  name,
  statement,
  photoUrl,
  isSelected,
  canVote,
  showVotes,
  votes,
  pct,
  onVote,
}: {
  name: string;
  statement: string | null;
  photoUrl: string | null;
  isSelected: boolean;
  canVote: boolean;
  showVotes: boolean;
  votes: number | undefined;
  pct: number;
  onVote: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.candidateCard, isSelected && styles.candidateSelected]}>
      <View style={styles.candidateTop}>
        {photoUrl
          ? <Image source={{ uri: photoUrl }} style={styles.avatar} />
          : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{name}</Text>
          {statement ? <Text style={styles.candidateStatement} numberOfLines={3}>{statement}</Text> : null}
        </View>
      </View>

      {showVotes && votes !== undefined && (
        <View style={styles.voteBar}>
          <View style={[styles.voteBarFill, { width: `${pct}%` }]} />
          <Text style={styles.voteBarText}>
            {votes}
            {' '}
            (
            {pct}
            %)
          </Text>
        </View>
      )}

      {canVote && (
        <Pressable style={styles.voteBtn} onPress={onVote}>
          <Text style={styles.voteBtnText}>{t('governance.vote')}</Text>
        </Pressable>
      )}
      {isSelected && (
        <View style={styles.votedRow}>
          <Text style={styles.votedText}>{t('governance.voted')}</Text>
        </View>
      )}
    </View>
  );
}

function ElectionSkeleton({ insets }: { insets: { top: number } }) {
  return (
    <View style={styles.container}>
      <View style={{ height: insets.top + 56, backgroundColor: DARK.card }} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="70%" height={28} />
        <Skeleton width="100%" height={100} borderRadius={RADIUS.md} />
        <Skeleton width="100%" height={100} borderRadius={RADIUS.md} />
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
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 22, color: DARK.text, lineHeight: 30, marginBottom: SPACING.sm },
  description: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22, marginBottom: SPACING.md },
  sealedBanner: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.gold,
  },
  sealedText: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  sectionTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text, marginBottom: SPACING.md },
  candidates: { gap: SPACING.md },
  candidateCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  candidateSelected: { borderColor: BRAND.gold },
  candidateTop: { flexDirection: 'row', gap: SPACING.md },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: DARK.elevated, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 20, color: BRAND.gold },
  candidateInfo: { flex: 1 },
  candidateName: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text },
  candidateStatement: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, lineHeight: 20, marginTop: 4 },
  voteBar: {
    height: 28,
    backgroundColor: DARK.elevated,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  voteBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: `${BRAND.gold}33`,
  },
  voteBarText: { fontFamily: FONT.sans, fontSize: 12, color: DARK.text, fontWeight: '600' },
  voteBtn: {
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 14, color: DARK.bg },
  votedRow: { alignItems: 'center' },
  votedText: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold, fontWeight: '600' },
  meta: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, marginTop: SPACING.lg, textAlign: 'center' },
});
