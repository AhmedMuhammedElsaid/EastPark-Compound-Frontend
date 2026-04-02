import type { AxiosResponse } from 'axios';
import type { Invitation, InvitationRole } from '@/services/api/admin';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showMessage } from 'react-native-flash-message';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, X } from 'phosphor-react-native';

import { adminApi } from '@/services/api/admin';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function InvitationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<InvitationRole>('MERCHANT');
  const [showForm, setShowForm] = React.useState(false);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery<
    AxiosResponse<{ data: { data: Invitation[]; nextCursor: string | null } }>,
    Error,
    { pages: AxiosResponse<{ data: { data: Invitation[]; nextCursor: string | null } }>[] },
    string[],
    string | undefined
  >({
    queryKey: ['admin-invitations'],
    queryFn: ({ pageParam }) => adminApi.getInvitations({ cursor: pageParam, limit: 20 }),
    getNextPageParam: last => last.data.data.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const { mutate: sendInvite, isPending } = useMutation({
    mutationFn: () => adminApi.sendInvitation(email.trim().toLowerCase(), role),
    onSuccess: () => {
      setEmail('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      showMessage({ message: t('admin.invite_sent'), type: 'success', backgroundColor: SEMANTIC.success });
    },
    onError: () => {
      showMessage({ message: t('common.error'), type: 'danger', backgroundColor: SEMANTIC.error });
    },
  });

  function handleSend() {
    if (!email.trim()) return;
    Alert.alert(
      t('admin.send_invite'),
      `${email.trim()} · ${t(`auth.role_${role.toLowerCase() as 'merchant' | 'admin'}`)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.send_invite'), onPress: () => sendInvite() },
      ],
    );
  }

  const invitations = data?.pages.flatMap(p => p.data.data.data).filter(Boolean) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={18} color={DARK.text} />
        </Pressable>
        <Text style={styles.navTitle}>{t('admin.invitations')}</Text>
        <Pressable
          style={[styles.newBtn, showForm && styles.newBtnActive]}
          onPress={() => setShowForm(v => !v)}
        >
          {showForm ? <X size={18} color={DARK.text} /> : <Plus size={18} color={DARK.bg} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formLabel}>{t('admin.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email')}
              placeholderTextColor={DARK.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.formLabel, { marginTop: SPACING.sm }]}>{t('admin.role')}</Text>
            <View style={styles.roleRow}>
              {(['MERCHANT', 'ADMIN'] as InvitationRole[]).map(r => (
                <Pressable
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                    {t(`auth.role_${r.toLowerCase() as 'merchant' | 'admin'}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.sendBtn, (!email.trim() || isPending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!email.trim() || isPending}
            >
              <Text style={styles.sendBtnText}>{t('admin.send_invite')}</Text>
            </Pressable>
          </View>
        )}

        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`inv-sk-${i}`} width="100%" height={72} borderRadius={RADIUS.md} style={{ marginBottom: SPACING.sm }} />
            ))
          : invitations.map(inv => <InvitationRow key={inv.id} invitation={inv} />)}

        {hasNextPage && (
          <Pressable
            style={styles.loadMoreBtn}
            onPress={() => { if (!isFetchingNextPage) fetchNextPage(); }}
            disabled={isFetchingNextPage}
          >
            <Text style={styles.loadMoreText}>{t('common.load_more')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isUsed = !!invitation.usedAt;
  const isExpired = !isUsed && new Date(invitation.expiresAt) < new Date();
  const statusKey = isUsed ? 'admin.used' : isExpired ? 'admin.expired' : 'admin.pending';
  const statusColor = isUsed ? SEMANTIC.success : isExpired ? SEMANTIC.error : SEMANTIC.warning;

  const date = new Date(invitation.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowEmail} numberOfLines={1}>{invitation.email}</Text>
        <Text style={styles.rowDate}>{date}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.rolePill, { backgroundColor: DARK.elevated }]}>
          <Text style={styles.rolePillText}>
            {t(`auth.role_${invitation.role.toLowerCase() as 'merchant' | 'admin'}`)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Text style={styles.statusPillText}>{t(statusKey)}</Text>
        </View>
      </View>
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
  navTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBtnActive: { backgroundColor: DARK.elevated },
  scroll: { padding: SPACING.base, gap: SPACING.sm },
  form: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  formLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.textMuted },
  input: {
    height: 48,
    backgroundColor: DARK.elevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.text,
    marginTop: 4,
  },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleBtnActive: { borderColor: BRAND.gold },
  roleBtnText: { fontFamily: FONT.sans, fontWeight: '500', fontSize: 13, color: DARK.textMuted },
  roleBtnTextActive: { color: BRAND.gold, fontWeight: '700' },
  sendBtn: {
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.bg },
  row: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowMain: { flex: 1, gap: 4 },
  rowEmail: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  rowDate: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  rowRight: { gap: SPACING.xs, alignItems: 'flex-end' },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  rolePillText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  statusPillText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  loadMoreBtn: { alignItems: 'center', paddingVertical: SPACING.md },
  loadMoreText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: BRAND.gold },
});
