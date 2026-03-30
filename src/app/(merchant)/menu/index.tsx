import type { Product } from '@/services/api/merchant';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { merchantApi } from '@/services/api/merchant';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function MerchantMenuScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAr = i18n.language === 'ar';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['merchant-products'],
    queryFn: () => merchantApi.getMyProducts({ limit: 100, includeUnavailable: true }),
  });

  const products = data?.data.data.data ?? [];

  const { mutate: toggleAvailability } = useMutation({
    mutationFn: ({ productId, isAvailable }: { productId: string; isAvailable: boolean }) =>
      merchantApi.updateProduct(productId, { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-products'] }),
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (productId: string) => merchantApi.deleteProduct(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-products'] }),
  });

  function handleDelete(product: Product) {
    const name = isAr ? product.nameAr : product.name;
    Alert.alert(
      t('common.delete'),
      `Delete "${name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteProduct(product.id) },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('merchant.menu')}</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/(merchant)/menu/new' as any)}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {isLoading
        ? (
            <View style={styles.loadingPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`product-sk-${i}`} width="100%" height={72} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
              ))}
            </View>
          )
        : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
              refreshControl={<RefreshControl refreshing={false} onRefresh={() => { void refetch(); }} tintColor={BRAND.gold} />}
            >
              {products.length === 0 && (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🍽</Text>
                  <Text style={styles.emptyText}>{t('common.no_results')}</Text>
                </View>
              )}
              {products.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isAr={isAr}
                  onToggle={v => toggleAvailability({ productId: product.id, isAvailable: v })}
                  onEdit={() => router.push(`/(merchant)/menu/${product.id}` as any)}
                  onDelete={() => handleDelete(product)}
                />
              ))}
            </ScrollView>
          )}
    </View>
  );
}

function ProductRow({
  product,
  isAr,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: Product;
  isAr: boolean;
  onToggle: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = isAr ? product.nameAr : product.name;

  return (
    <View style={[styles.row, !product.isAvailable && styles.rowUnavailable]}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
        <Text style={styles.rowPrice}>
          EGP
          {product.price.toFixed(2)}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <Switch
          value={product.isAvailable}
          onValueChange={onToggle}
          trackColor={{ true: SEMANTIC.success, false: DARK.elevated }}
          thumbColor={DARK.text}
        />
        <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={8}>
          <Text style={styles.editBtnText}>✏️</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </Pressable>
      </View>
    </View>
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
  navTitle: { flex: 1, fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 22, color: DARK.bg, lineHeight: 26 },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base, gap: SPACING.sm },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  rowUnavailable: { opacity: 0.6 },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  rowPrice: { fontFamily: FONT.sans, fontSize: 13, color: BRAND.gold },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  editBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { fontSize: 18 },
  deleteBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { fontSize: 18 },
});
