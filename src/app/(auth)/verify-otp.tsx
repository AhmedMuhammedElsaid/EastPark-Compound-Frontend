import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import OTPTextInput from 'react-native-otp-textinput';

import { AuthScreenWrapper } from '@/components/auth/auth-screen-wrapper';
import { BrandMark } from '@/components/auth/brand-mark';
import { GoldButton } from '@/components/auth/gold-button';
import { authApi } from '@/services/api/auth';
import { SECURE_KEY_ACCESS, SECURE_KEY_REFRESH } from '@/services/api/client';
import { usersApi } from '@/services/api/users';
import { useAppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';
import { BRAND, DARK, FONT, SEMANTIC, SPACING } from '@/theme/tokens';

const RESEND_COOLDOWN = 60;

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

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const dispatch = useAppDispatch();
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0)
      return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    if (otp.length < 6)
      return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } = res.data.data;
      await SecureStore.setItemAsync(SECURE_KEY_ACCESS, accessToken);
      await SecureStore.setItemAsync(SECURE_KEY_REFRESH, refreshToken);
      dispatch(login({ user, accessToken, refreshToken }));
      await registerPushToken();
      router.replace('/(tabs)');
    }
    catch {
      showMessage({ message: t('auth.errors.invalid_otp'), type: 'danger', backgroundColor: SEMANTIC.error });
    }
    finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending)
      return;
    setResending(true);
    try {
      await authApi.resendOtp(email);
      setCooldown(RESEND_COOLDOWN);
      showMessage({ message: t('auth.otp_resent'), type: 'success', backgroundColor: SEMANTIC.success });
    }
    catch {
      showMessage({ message: t('common.error'), type: 'danger', backgroundColor: SEMANTIC.error });
    }
    finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenWrapper>
      <View style={styles.header}><BrandMark size="sm" /></View>
      <Text style={styles.title}>{t('auth.verify_otp')}</Text>
      <Text style={styles.subtitle}>{t('auth.otp_sent')}</Text>
      <Text style={styles.emailHint}>{email}</Text>
      <View style={styles.otpContainer}>
        <OTPTextInput inputCount={6} handleTextChange={setOtp} tintColor={BRAND.gold} offTintColor={DARK.border} textInputStyle={styles.otpBox as any} containerStyle={styles.otpRow} keyboardType="numeric" />
      </View>
      <GoldButton label={t('common.confirm')} onPress={handleVerify} loading={loading} disabled={otp.length < 6} />
      <View style={styles.resendRow}>
        {cooldown > 0
          ? <Text style={styles.resendTimer}>{t('auth.resend_in', { seconds: cooldown })}</Text>
          : <Pressable onPress={handleResend} disabled={resending} hitSlop={8}><Text style={[styles.resendLink, resending && styles.resendDisabled]}>{t('auth.resend_otp')}</Text></Pressable>}
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING['2xl'] },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 24, color: DARK.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center' },
  emailHint: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: BRAND.gold, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING['2xl'] },
  otpContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  otpRow: { justifyContent: 'center', gap: SPACING.sm },
  otpBox: { width: 48, height: 56, backgroundColor: DARK.card, borderRadius: 8, borderWidth: 1.5, borderColor: DARK.border, color: DARK.text, fontFamily: FONT.sans, fontSize: 22, fontWeight: '700' },
  resendRow: { alignItems: 'center', marginTop: SPACING.lg },
  resendLink: { fontFamily: FONT.sans, fontSize: 14, color: BRAND.gold, fontWeight: '600' },
  resendTimer: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted },
  resendDisabled: { opacity: 0.5 },
});
