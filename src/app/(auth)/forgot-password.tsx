import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { z } from 'zod';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenWrapper } from '@/components/auth/auth-screen-wrapper';
import { BrandMark } from '@/components/auth/brand-mark';
import { GoldButton } from '@/components/auth/gold-button';
import { authApi } from '@/services/api/auth';
import { DARK, FONT, SPACING } from '@/theme/tokens';

const schema = z.object({
  email: z.string().email('auth.errors.invalid_email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit({ email }: FormData) {
    try {
      await authApi.forgotPassword(email);
      setSentEmail(email);
      setSent(true);
    }
    catch {
      showMessage({
        message: t('common.error'),
        type: 'danger',
        backgroundColor: '#B03A2E',
      });
    }
  }

  if (sent) {
    return (
      <AuthScreenWrapper scrollable={false}>
        <View style={styles.header}>
          <BrandMark size="sm" />
        </View>

        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>{t('auth.reset_link_sent')}</Text>
          <Text style={styles.successBody}>
            {t('auth.reset_link_body', { email: sentEmail })}
          </Text>
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
      <Text style={styles.subtitle}>{t('auth.forgot_password_body')}</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label={t('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email ? t(errors.email.message as string) : undefined}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </View>

      <GoldButton
        label={t('auth.send_reset_link')}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />

      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backLink}>
            ←
            {t('common.back')}
          </Text>
        </Pressable>
      </View>
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
    lineHeight: 22,
  },
  form: { marginBottom: SPACING.sm },
  footer: { alignItems: 'center', marginTop: SPACING.lg },
  backLink: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.textMuted,
  },

  // Success state
  successCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  successIcon: { fontSize: 56 },
  successTitle: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 22,
    color: DARK.text,
    textAlign: 'center',
  },
  successBody: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
