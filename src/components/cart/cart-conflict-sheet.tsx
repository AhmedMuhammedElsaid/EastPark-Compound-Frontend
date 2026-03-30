import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store';
import { clearAndAdd, dismissConflict } from '@/store/slices/cartSlice';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

/**
 * Global modal that appears when the user tries to add a product from a
 * different shop while there are already items in the cart.
 * Connected to Redux cartSlice.showConflictSheet.
 */
export function CartConflictSheet() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { showConflictSheet, pendingShopName, shopName } = useAppSelector((s) => s.cart);

  if (!showConflictSheet) return null;

  const conflictingShop = shopName ?? '';

  return (
    <Modal
      visible={showConflictSheet}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => dispatch(dismissConflict())}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('cart.shop_conflict_title')}</Text>
          <Text style={styles.body}>
            {t('cart.shop_conflict_body', { shopName: conflictingShop })}
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnOutline]}
              onPress={() => dispatch(dismissConflict())}
            >
              <Text style={styles.btnOutlineText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnGold]}
              onPress={() => dispatch(clearAndAdd())}
            >
              <Text style={styles.btnGoldText}>{t('cart.clear_and_add')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  sheet: {
    backgroundColor: DARK.elevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    gap: SPACING.md,
  },
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  body: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutline: { borderWidth: 1, borderColor: DARK.border },
  btnOutlineText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.textMuted },
  btnGold: { backgroundColor: BRAND.gold },
  btnGoldText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 14, color: DARK.bg },
});
