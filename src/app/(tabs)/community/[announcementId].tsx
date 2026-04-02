import type { AxiosResponse } from 'axios';
import type { Comment } from '@/services/api/community';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FilePdf, PaperPlaneTilt } from 'phosphor-react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

export default function AnnouncementDetailScreen() {
  const { announcementId } = useLocalSearchParams<{ announcementId: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: () => communityApi.getAnnouncement(announcementId),
    enabled: !!announcementId,
  });

  const ann = data?.data.data;
  const isAr = i18n.language === 'ar';
  const title = ann ? (isAr ? ann.titleAr : ann.title) : '';
  const body = ann ? (isAr ? ann.bodyAr : ann.body) : '';

  if (isLoading || !ann)
    return <AnnouncementSkeleton insets={insets} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.nav, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={18} color={DARK.text} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        {ann.pdfUrl && (
          <Pressable style={styles.pdfRow} onPress={() => Linking.openURL(ann.pdfUrl!)}>
            <FilePdf size={24} color={BRAND.gold} />
            <Text style={styles.pdfLabel}>{t('community.view_pdf')}</Text>
          </Pressable>
        )}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{t('community.comments')}</Text>
        <CommentsSection announcementId={announcementId} />
      </ScrollView>

      <AddCommentBar announcementId={announcementId} bottomInset={insets.bottom} />
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CommentsSection({ announcementId }: { announcementId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: Comment[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: Comment[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['comments', announcementId],
      queryFn: ({ pageParam }) =>
        communityApi.getComments(announcementId, { cursor: pageParam, limit: 20 }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const comments = data?.pages.flatMap(p => p.data.data.data).filter(Boolean) ?? [];

  if (isLoading) {
    return (
      <View style={styles.commentsWrap}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`comment-sk-${i}`} width="100%" height={64} borderRadius={RADIUS.sm} style={{ marginBottom: 10 }} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.commentsWrap}>
      {comments.map(c => <CommentRow key={c.id} comment={c} />)}
      {hasNextPage && (
        <Pressable
          style={styles.loadMoreBtn}
          onPress={() => {
            if (!isFetchingNextPage)
              fetchNextPage();
          }}
        >
          <Text style={styles.loadMoreText}>{t('common.load_more')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{comment.user.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentName}>{comment.user.name}</Text>
        <Text style={styles.commentBody}>{comment.body}</Text>
      </View>
    </View>
  );
}

function AddCommentBar({ announcementId, bottomInset }: { announcementId: string; bottomInset: number }) {
  const { t } = useTranslation();
  const { requireAuth } = useAuthGuard();
  const queryClient = useQueryClient();
  const [text, setText] = React.useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => communityApi.addComment(announcementId, text),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', announcementId] });
    },
  });

  function handleSubmit() {
    if (!text.trim())
      return;
    requireAuth(() => mutate());
  }

  return (
    <View style={[styles.commentBar, { paddingBottom: bottomInset + SPACING.sm }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('community.comment_placeholder')}
        placeholderTextColor={DARK.textMuted}
        style={styles.commentInput}
        multiline
        maxLength={500}
      />
      <Pressable
        style={[styles.sendBtn, (!text.trim() || isPending) && styles.sendBtnDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim() || isPending}
      >
        <PaperPlaneTilt size={20} color={DARK.bg} />
      </Pressable>
    </View>
  );
}

function AnnouncementSkeleton({ insets }: { insets: { top: number } }) {
  return (
    <View style={styles.container}>
      <View style={{ height: insets.top + 56, backgroundColor: DARK.card }} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="80%" height={28} />
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
    paddingBottom: SPACING.sm,
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
  navTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '600', fontSize: 16, color: DARK.text },
  scroll: { padding: SPACING.base },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 22, color: DARK.text, lineHeight: 32, marginBottom: SPACING.md },
  body: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted, lineHeight: 26 },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
  },
  pdfLabel: { fontFamily: FONT.sans, fontSize: 14, color: BRAND.gold, fontWeight: '600' },
  divider: { height: 1, backgroundColor: DARK.border, marginVertical: SPACING.lg },
  sectionTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text, marginBottom: SPACING.md },
  commentsWrap: { gap: SPACING.sm },
  commentRow: { flexDirection: 'row', gap: SPACING.sm },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 14, color: BRAND.gold },
  commentContent: { flex: 1, backgroundColor: DARK.card, borderRadius: RADIUS.sm, padding: SPACING.sm },
  commentName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.text },
  commentBody: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, lineHeight: 20, marginTop: 2 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  loadMoreText: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold, fontWeight: '600' },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    backgroundColor: DARK.card,
    borderTopWidth: 1,
    borderTopColor: DARK.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: DARK.elevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
