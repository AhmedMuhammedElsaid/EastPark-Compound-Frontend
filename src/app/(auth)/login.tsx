import { zodResolver } from '@hookform/resolvers/zod';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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
import { SECURE_KEY_ACCESS, SECURE_KEY_REFRESH } from '@/services/api/client';
import { usersApi } from '@/services/api/users';
import { useAppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';
import { BRAND, DARK, FONT, SPACING } from '@/theme/tokens';

const schema = z.object({
  email: z.string().email('auth.errors.invalid_email'),
  password: z.string().min(8, 'auth.errors.password_too_short'),
});
type FormData = z.infer<typeof schema>;

async function registerPushToken() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      const token = await Notifications.getExpoPushTokenAsync();
      await usersApi.updatePushToken(token.data);
    }
  }
  catch {}
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = React.useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit({ email, password }: FormData) {
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      await SecureStore.setItemAsync(SECURE_KEY_ACCESS, accessToken);
      await SecureStore.setItemAsync(SECURE_KEY_REFRESH, refreshToken);
      dispatch(login({ user, accessToken, refreshToken }));
      await registerPushToken();
      router.replace('/(tabs)');
    }
    catch {
      showMessage({ message: t('auth.errors.login_failed'), type: 'danger', backgroundColor: '#B03A2E' });
    }
  }

  return (
    <AuthScreenWrapper>
      <View style={styles.header}><BrandMark size="md" /></View>
      <Text style={styles.title}>{t('auth.login')}</Text>
      <Text style={styles.subtitle}>{t('auth.welcome_back')}</Text>
      <LoginForm control={control} errors={errors} showPassword={showPassword} onTogglePassword={() => setShowPassword(v => !v)} onSubmitEditing={handleSubmit(onSubmit)} />
      <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow} hitSlop={8}>
        <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
      </Pressable>
      <GoldButton label={t('auth.login')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('auth.no_account')}
          {' '}
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/register')} hitSlop={8}>
          <Text style={styles.footerLink}>{t('auth.register')}</Text>
        </Pressable>
      </View>
      <View style={styles.bottomPad} />
    </AuthScreenWrapper>
  );
}

type LoginFormProps = {
  control: any;
  errors: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmitEditing: () => void;
};

function LoginForm({ control, errors, showPassword, onTogglePassword, onSubmitEditing }: LoginFormProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label={t('auth.email')} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email ? t(errors.email.message) : undefined} keyboardType="email-address" autoComplete="email" returnKeyType="next" />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            label={t('auth.password')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password ? t(errors.password.message) : undefined}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            rightSlot={<Pressable onPress={onTogglePassword} hitSlop={12}><Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text></Pressable>}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING['2xl'] },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 26, color: DARK.text, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center', marginBottom: SPACING.xl },
  form: { gap: SPACING.xs },
  forgotRow: { alignSelf: 'flex-end', marginTop: SPACING.xs, marginBottom: SPACING.sm },
  forgotText: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg },
  footerText: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted },
  footerLink: { fontFamily: FONT.sans, fontSize: 14, color: BRAND.gold, fontWeight: '600' },
  eyeIcon: { fontSize: 16 },
  bottomPad: { height: SPACING['2xl'] },
});
