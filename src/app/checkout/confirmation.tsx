import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function ConfirmationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  // Entry animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [opacity, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.xl, paddingTop: insets.top }]}>
      <View style={styles.body}>
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <LottieView
            source={require('../../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
          />
        </Animated.View>

        <Animated.View style={[styles.textWrap, contentStyle]}>
          <Text style={styles.title}>{t('checkout.order_placed')}</Text>
          <Text style={styles.subtitle}>{t('checkout.order_placed_subtitle')}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.actions, contentStyle]}>
        <Pressable
          style={styles.viewOrderBtn}
          onPress={() => {
            if (orderId)
              router.replace(`/(tabs)/orders/${orderId}` as any);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('home.my_orders')}
        >
          <Text style={styles.viewOrderBtnText}>{t('home.my_orders')}</Text>
        </Pressable>

        <Pressable
          style={styles.continueBtn}
          onPress={() => router.replace('/(tabs)/directory' as any)}
          accessibilityRole="button"
          accessibilityLabel={t('directory.title')}
        >
          <Text style={styles.continueBtnText}>{t('directory.title')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK.bg,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: { alignItems: 'center', gap: SPACING.sm },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 26, color: DARK.text, textAlign: 'center' },
  subtitle: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted, textAlign: 'center', lineHeight: 24 },
  actions: { gap: SPACING.md },
  viewOrderBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewOrderBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
  continueBtn: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: DARK.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.textMuted },
});
