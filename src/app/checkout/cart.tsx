import type { CartItem } from '@/store/slices/cartSlice';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart, updateQuantity } from '@/store/slices/cartSlice';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function CartScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items, shopName } = useAppSelector(s => s.cart);
  const isAr = i18n.language === 'ar';

  const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

  if (!items.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CartNav />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t('cart.empty')}</Text>
          <Text style={styles.emptyBody}>{t('cart.empty_subtitle')}</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.replace('/(tabs)/directory' as any)}>
            <Text style={styles.browseBtnText}>{t('directory.title')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CartNav shopName={shopName ?? undefined} onClear={() => dispatch(clearCart())} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {items.map((item: CartItem) => (
          <CartItemRow
            key={item.productId}
            item={item}
            isAr={isAr}
            onIncrease={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
            onDecrease={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.total')}</Text>
          <Text style={styles.totalValue}>
            EGP
            {total.toFixed(2)}
          </Text>
        </View>
        <Pressable
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout/address' as any)}
        >
          <Text style={styles.checkoutBtnText}>{t('cart.checkout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CartNav({ shopName, onClear }: { shopName?: string; onClear?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.nav}>
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Text style={styles.navTitle}>{shopName || t('cart.title')}</Text>
      {onClear && (
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={styles.clearText}>{t('common.clear')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CartItemRow({
  item,
  isAr,
  onIncrease,
  onDecrease,
}: {
  item: any;
  isAr: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const name = isAr ? item.nameAr : item.name;
  const subtotal = (item.price * item.quantity).toFixed(2);

  return (
    <View style={styles.itemRow}>
      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.itemImg} resizeMode="cover" />
        : <View style={styles.itemImgPlaceholder} />}

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
        <Text style={styles.itemPrice}>
          EGP
          {item.price.toFixed(2)}
        </Text>
      </View>

      <View style={styles.qtyControls}>
        <Pressable style={styles.qtyBtn} onPress={onDecrease} hitSlop={8}>
          <Text style={styles.qtyBtnText}>{item.quantity === 1 ? '🗑' : '−'}</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <Pressable style={styles.qtyBtn} onPress={onIncrease} hitSlop={8}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
        <Text style={styles.itemSubtotal}>
          EGP
          {subtotal}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  navTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  clearText: { fontFamily: FONT.sans, fontSize: 13, color: SEMANTIC.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text, textAlign: 'center' },
  emptyBody: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, textAlign: 'center', lineHeight: 22 },
  browseBtn: {
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  browseBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.bg },
  scroll: { padding: SPACING.base },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    alignItems: 'center',
  },
  itemImg: { width: 64, height: 64, borderRadius: RADIUS.sm },
  itemImgPlaceholder: { width: 64, height: 64, borderRadius: RADIUS.sm, backgroundColor: DARK.elevated },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text, lineHeight: 20 },
  itemPrice: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  qtyControls: { alignItems: 'center', gap: SPACING.xs },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, color: DARK.text },
  qtyValue: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.text },
  itemSubtotal: { fontFamily: FONT.sans, fontSize: 12, color: BRAND.gold, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK.card,
    borderTopWidth: 1,
    borderTopColor: DARK.border,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.text },
  totalValue: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: BRAND.gold },
  checkoutBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
