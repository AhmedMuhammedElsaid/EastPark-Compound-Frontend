import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { z } from 'zod';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenWrapper } from '@/components/auth/auth-screen-wrapper';
import { BrandMark } from '@/components/auth/brand-mark';
import { GoldButton } from '@/components/auth/gold-button';
import { authApi } from '@/services/api/auth';
import { SECURE_KEY_ACCESS, SECURE_KEY_REFRESH } from '@/services/api/client';
import { useAppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';
import { BRAND, DARK, FONT, SEMANTIC, SPACING } from '@/theme/tokens';

const schema = z.object({
  name: z.string().min(2, 'auth.errors.name_too_short'),
  password: z.string().min(8, 'auth.errors.password_too_short'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'auth.errors.passwords_no_match', path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

export default function AcceptInvitationScreen() {
  const { t } = useTranslation();
  const { token, role } = useLocalSearchParams<{ token: string; role?: string }>();
  const dispatch = useAppDispatch();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', password: '', confirmPassword: '' },
  });

  async function onSubmit({ name, password }: FormData) {
    if (!token)
      return;
    try {
      const res = await authApi.acceptInvitation(token, name, password);
      const { user, accessToken, refreshToken } = res.data.data;
      await SecureStore.setItemAsync(SECURE_KEY_ACCESS, accessToken);
      await SecureStore.setItemAsync(SECURE_KEY_REFRESH, refreshToken);
      dispatch(login({ user, accessToken, refreshToken }));
      router.replace(
        user.role === 'MERCHANT'
          ? '/(merchant)/dashboard'
          : user.role === 'ADMIN'
            ? '/(admin)'
            : '/(tabs)'
      );
    }
    catch {
      showMessage({ message: t('common.error'), type: 'danger', backgroundColor: SEMANTIC.error });
    }
  }

  if (!token) {
    return (
      <AuthScreenWrapper scrollable={false}>
        <View style={styles.header}><BrandMark size="md" /></View>
        <View style={styles.errorCard}>
          <View style={[styles.errorBorder, { borderLeftColor: SEMANTIC.error }]}>
            <Text style={styles.errorTitle}>{t('auth.invitation_invalid')}</Text>
            <Text style={styles.errorBody}>{t('auth.contact_administrator')}</Text>
          </View>
        </View>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper>
      <View style={styles.header}><BrandMark size="md" /></View>
      <Text style={styles.title}>{t('auth.accept_invitation')}</Text>
      <View style={styles.roleBadgeRow}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{role === 'ADMIN' ? t('auth.role_admin') : t('auth.role_merchant')}</Text>
        </View>
      </View>
      <InvitationForm control={control} errors={errors} onSubmitEditing={handleSubmit(onSubmit)} />
      <GoldButton label={t('auth.complete_setup')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      <View style={styles.bottomPad} />
    </AuthScreenWrapper>
  );
}

function InvitationForm({ control, errors, onSubmitEditing }: { control: any; errors: any; onSubmitEditing: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label={t('auth.name')} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name ? t(errors.name.message) : undefined} autoComplete="name" returnKeyType="next" />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label={t('auth.password')} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password ? t(errors.password.message) : undefined} secureTextEntry returnKeyType="next" />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label={t('auth.confirm_password')} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword ? t(errors.confirmPassword.message) : undefined} secureTextEntry returnKeyType="done" onSubmitEditing={onSubmitEditing} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 24, color: DARK.text, textAlign: 'center', marginBottom: SPACING.md },
  roleBadgeRow: { alignItems: 'center', marginBottom: SPACING.xl },
  roleBadge: { borderWidth: 1.5, borderColor: BRAND.gold, borderRadius: 9999, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs },
  roleBadgeText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: BRAND.gold, letterSpacing: 1 },
  form: { gap: SPACING.xs, marginBottom: SPACING.sm },
  bottomPad: { height: SPACING['2xl'] },
  errorCard: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.base },
  errorBorder: { borderLeftWidth: 4, borderRadius: 8, backgroundColor: DARK.card, padding: SPACING.lg, gap: SPACING.sm },
  errorTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  errorBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22 },
});
