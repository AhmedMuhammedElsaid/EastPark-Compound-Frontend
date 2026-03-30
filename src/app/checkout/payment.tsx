import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/slices/cartSlice';
import type { PaymentMethod } from '@/services/api/orders';
import { ordersApi } from '@/services/api/orders';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { notes } = useLocalSearchParams<{ notes?: string }>();
  const { items, shopId } = useAppSelector((s) => s.cart);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      ordersApi.placeOrder({
        shopId: shopId!,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        paymentMethod,
        notes: notes || undefined,
      }),
    onSuccess: (res) => {
      const orderId = res.data.data.id;
      dispatch(clearCart());
      router.replace({ pathname: '/checkout/confirmation' as any, params: { orderId } });
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('checkout.payment')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>{t('checkout.payment')}</Text>

        <PaymentOption
          label={t('checkout.cash')}
          icon="💵"
          selected={paymentMethod === 'CASH'}
          onPress={() => setPaymentMethod('CASH')}
        />
        <PaymentOption
          label={t('checkout.card')}
          icon="💳"
          selected={paymentMethod === 'PAYMOB'}
          onPress={() => setPaymentMethod('PAYMOB')}
        />

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{t('cart.total')}</Text>
          <Text style={styles.summaryValue}>EGP {total.toFixed(2)}</Text>
        </View>

        <Pressable
          style={[styles.placeBtn, isPending && styles.placeBtnDisabled]}
          onPress={() => mutate()}
          disabled={isPending}
        >
          <Text style={styles.placeBtnText}>
            {isPending ? t('common.loading') : t('checkout.place_order')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PaymentOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
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
  backIcon: { fontSize: 16, color: DARK.text },
  navTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  content: { padding: SPACING.base, gap: SPACING.md },
  sectionLabel: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  optionSelected: { borderColor: BRAND.gold },
  optionIcon: { fontSize: 24 },
  optionLabel: { flex: 1, fontFamily: FONT.sans, fontWeight: '500', fontSize: 15, color: DARK.textMuted },
  optionLabelSelected: { color: DARK.text },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: DARK.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: BRAND.gold },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.gold },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  summaryLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.text },
  summaryValue: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: BRAND.gold },
  placeBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  placeBtnDisabled: { opacity: 0.5 },
  placeBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
