import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
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
import { DARK, FONT, SEMANTIC, SPACING } from '@/theme/tokens';

const schema = z
  .object({
    password: z.string().min(8, 'auth.errors.password_too_short'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'auth.errors.passwords_no_match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit({ password }: FormData) {
    if (!token)
      return;
    try {
      await authApi.resetPassword(token, password);
      showMessage({
        message: t('auth.password_reset_success'),
        type: 'success',
        backgroundColor: SEMANTIC.success,
      });
      router.replace('/(auth)/login');
    }
    catch {
      showMessage({
        message: t('auth.reset_link_expired'),
        type: 'danger',
        backgroundColor: SEMANTIC.error,
      });
    }
  }

  if (!token) {
    return (
      <AuthScreenWrapper scrollable={false}>
        <View style={styles.header}>
          <BrandMark size="sm" />
        </View>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t('auth.invalid_reset_link')}</Text>
          <Text style={styles.errorBody}>{t('auth.contact_administrator')}</Text>
        </View>
        <GoldButton
          variant="outline"
          label={t('auth.back_to_login')}
          onPress={() => router.replace('/(auth)/login')}
        />
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper>
      <View style={styles.header}>
        <BrandMark size="sm" />
      </View>

      <Text style={styles.title}>{t('auth.reset_password')}</Text>
      <Text style={styles.subtitle}>{t('auth.choose_new_password')}</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label={t('auth.password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password ? t(errors.password.message as string) : undefined}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label={t('auth.confirm_password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword ? t(errors.confirmPassword.message as string) : undefined}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </View>

      <GoldButton
        label={t('auth.reset_password')}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  title: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 24,
    color: DARK.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: { gap: SPACING.xs, marginBottom: SPACING.sm },

  errorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 20,
    color: DARK.text,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.textMuted,
    textAlign: 'center',
  },
});
