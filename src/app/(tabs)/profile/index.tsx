import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { deleteSecureItem } from '@/lib/secure-storage';
import { BookmarkSimple, CaretRight, ChatCircle, Package, SignOut, Storefront, User, WarningOctagon } from 'phosphor-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/lib/hooks/use-app-colors';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { useSelectedLanguage } from '@/lib/i18n';
import { SECURE_KEY_ACCESS, SECURE_KEY_REFRESH } from '@/services/api/client';
import { usersApi } from '@/services/api/users';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { BRAND, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

function useStyles() {
  const colors = useAppColors();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.md },
    headerTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 24, color: colors.text },
    scroll: { padding: SPACING.base, gap: SPACING.md },
    guestCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      alignItems: 'center' as const,
      gap: SPACING.sm,
    },
    guestPrompt: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: colors.text, textAlign: 'center' as const },
    guestSubtitle: { fontFamily: FONT.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center' as const, lineHeight: 22 },
    signInBtn: {
      height: 48,
      paddingHorizontal: SPACING.xl,
      borderRadius: RADIUS.md,
      backgroundColor: BRAND.gold,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: SPACING.sm,
    },
    signInBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: colors.bg },
    avatarCard: {
      flexDirection: 'row' as const,
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.md,
      alignItems: 'center' as const,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.elevated,
      borderWidth: 2,
      borderColor: BRAND.gold,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    avatarInitial: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 26, color: BRAND.gold },
    avatarInfo: { flex: 1, gap: 4 },
    userName: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: colors.text },
    userEmail: { fontFamily: FONT.sans, fontSize: 13, color: colors.textMuted },
    userUnit: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold, fontWeight: '600' },
    section: { backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
    sectionTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1 },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: SPACING.sm,
      gap: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowDanger: {},
    rowIconWrap: { width: 28, alignItems: 'center' as const },
    rowLabel: { flex: 1, fontFamily: FONT.sans, fontSize: 15, color: colors.text, fontWeight: '500' },
    rowLabelDanger: { flex: 1, fontFamily: FONT.sans, fontSize: 15, color: SEMANTIC.error, fontWeight: '500' },
    segmentRow: {
      flexDirection: 'row' as const,
      backgroundColor: colors.elevated,
      borderRadius: RADIUS.md,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      height: 36,
      borderRadius: RADIUS.sm,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    segmentActive: { backgroundColor: colors.card },
    segmentText: { fontFamily: FONT.sans, fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    segmentTextActive: { color: colors.text, fontWeight: '600' },
  }), [colors]);
  return { styles, colors };
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { styles } = useStyles();
  const user = useAppSelector(s => s.auth.user);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        {isAuthenticated && user
          ? <AuthenticatedProfile user={user} />
          : <GuestProfile />}
      </ScrollView>
    </View>
  );
}

// ─── Auth/Guest views ─────────────────────────────────────────────────────────

function GuestProfile() {
  const { t } = useTranslation();
  const { styles, colors } = useStyles();
  return (
    <>
      <View style={styles.guestCard}>
        <User size={32} color={colors.textMuted} />
        <Text style={styles.guestPrompt}>{t('profile.guest_prompt')}</Text>
        <Text style={styles.guestSubtitle}>{t('profile.guest_subtitle')}</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push('/(auth)/login' as any)} accessibilityRole="button" accessibilityLabel={t('auth.login')}>
          <Text style={styles.signInBtnText}>{t('auth.login')}</Text>
        </Pressable>
      </View>
      <PreferencesSection />
    </>
  );
}

function AuthenticatedProfile({ user }: { user: any }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { mutate: deleteAccount } = useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: async () => {
      await deleteSecureItem(SECURE_KEY_ACCESS);
      await deleteSecureItem(SECURE_KEY_REFRESH);
      dispatch(logout());
    },
  });

  function handleLogout() {
    Alert.alert(t('auth.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        onPress: async () => {
          await deleteSecureItem(SECURE_KEY_ACCESS);
          await deleteSecureItem(SECURE_KEY_REFRESH);
          dispatch(logout());
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(t('profile.delete_account'), t('profile.delete_account_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.delete_account_button'), style: 'destructive', onPress: () => deleteAccount() },
    ]);
  }

  return (
    <>
      <UserAvatar name={user.name} unitNumber={user.unitNumber} email={user.email} />
      <AccountSection role={user.role} />
      <PreferencesSection />
      <DangerSection onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />
    </>
  );
}

// ─── Section sub-components ───────────────────────────────────────────────────

function UserAvatar({ name, unitNumber, email }: { name: string; unitNumber: string; email: string }) {
  const { t } = useTranslation();
  const { styles } = useStyles();
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={styles.avatarCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
      <View style={styles.avatarInfo}>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userEmail}>{email}</Text>
        <Text style={styles.userUnit}>{t('checkout.unit', { number: unitNumber })}</Text>
      </View>
    </View>
  );
}

function AccountSection({ role }: { role: string }) {
  const { t } = useTranslation();
  const { styles, colors } = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
      {role === 'MERCHANT' && (
        <ProfileRow icon={<Storefront size={20} color={colors.text} />} label={t('profile.manage_shop')} onPress={() => router.push('/(merchant)/dashboard' as any)} />
      )}
      <ProfileRow icon={<Package size={20} color={colors.text} />} label={t('profile.my_orders')} onPress={() => router.push('/(tabs)/orders' as any)} />
      <ProfileRow icon={<ChatCircle size={20} color={colors.text} />} label={t('profile.my_feedback')} onPress={() => router.push('/(tabs)/community/feedback' as any)} />
      <ProfileRow icon={<BookmarkSimple size={20} color={colors.text} />} label={t('profile.saved_shops')} onPress={() => router.push('/(tabs)/directory' as any)} />
    </View>
  );
}

function PreferencesSection() {
  const { t } = useTranslation();
  const { styles } = useStyles();
  const { language, setLanguage } = useSelectedLanguage();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  const themes: { value: ColorSchemeType; label: string }[] = [
    { value: 'dark', label: t('profile.dark') },
    { value: 'light', label: t('profile.light') },
    { value: 'system', label: t('profile.system') },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
      <View style={styles.segmentRow}>
        {(['en', 'ar'] as const).map(lang => (
          <Pressable
            key={lang}
            style={[styles.segment, language === lang && styles.segmentActive]}
            onPress={() => setLanguage(lang)}
            accessibilityRole="radio"
            accessibilityLabel={lang === 'en' ? t('profile.english') : t('profile.arabic')}
            accessibilityState={{ checked: language === lang }}
          >
            <Text style={[styles.segmentText, language === lang && styles.segmentTextActive]}>
              {lang === 'en' ? t('profile.english') : t('profile.arabic')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>{t('profile.theme')}</Text>
      <View style={styles.segmentRow}>
        {themes.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[styles.segment, selectedTheme === value && styles.segmentActive]}
            onPress={() => setSelectedTheme(value)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selectedTheme === value }}
          >
            <Text style={[styles.segmentText, selectedTheme === value && styles.segmentTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DangerSection({ onLogout, onDeleteAccount }: { onLogout: () => void; onDeleteAccount: () => void }) {
  const { t } = useTranslation();
  const { styles } = useStyles();
  return (
    <View style={styles.section}>
      <Pressable style={[styles.row, styles.rowDanger]} onPress={onLogout} accessibilityRole="button" accessibilityLabel={t('auth.logout')}>
        <SignOut size={20} color={SEMANTIC.error} />
        <Text style={styles.rowLabelDanger}>{t('auth.logout')}</Text>
      </Pressable>
      <Pressable style={[styles.row, styles.rowDanger]} onPress={onDeleteAccount} accessibilityRole="button" accessibilityLabel={t('profile.delete_account')}>
        <WarningOctagon size={20} color={SEMANTIC.error} />
        <Text style={styles.rowLabelDanger}>{t('profile.delete_account')}</Text>
      </Pressable>
    </View>
  );
}

function ProfileRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const { styles, colors } = useStyles();
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <CaretRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

