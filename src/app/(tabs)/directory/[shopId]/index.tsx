import type { AxiosResponse } from 'axios';
import type { CursorPage, Product, Shop } from '@/services/api/shops';
import type { CartItem } from '@/store/slices/cartSlice';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChatCircle, Heart, HeartStraight, Phone, Plus, Star } from 'phosphor-react-native';

import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthGuard } from '@/lib/hooks/use-auth-guard';
import { shopsApi } from '@/services/api/shops';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

export default function ShopDetailScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { requireAuth } = useAuthGuard();
  const [saved, setSaved] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'menu' | 'reviews'>('menu');

  const { data, isLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopsApi.getShop(shopId),
    enabled: !!shopId,
  });

  const shop = data?.data.data;
  const isAr = i18n.language === 'ar';

  async function handleSave() {
    requireAuth(async () => {
      try {
        if (saved)
          await shopsApi.unsaveShop(shopId);
        else await shopsApi.saveShop(shopId);
        setSaved(v => !v);
      }
      catch {}
    });
  }

  if (isLoading || !shop)
    return <ShopDetailSkeleton />;

  return (
    <View style={styles.container}>
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
      >
        <ShopHero
          shop={shop}
          saved={saved}
          onBack={() => router.back()}
          onSave={handleSave}
          topInset={insets.top}
        />

        <ShopTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <ShopInfoSection shop={shop} isAr={isAr} />

        {activeTab === 'menu' && <MenuTabContent shopId={shopId} shopName={shop.name} />}
        {activeTab === 'reviews' && <ReviewsTabContent shopId={shopId} />}
      </ScrollView>
      <CartBar shopId={shopId} bottomInset={insets.bottom} />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ShopHeroProps = {
  shop: Shop;
  saved: boolean;
  onBack: () => void;
  onSave: () => void;
  topInset: number;
};

function ShopHero({ shop, saved, onBack, onSave, topInset }: ShopHeroProps) {
  const { t } = useTranslation();
  const coverPhoto = shop.photos[0];
  return (
    <View style={styles.hero}>
      {coverPhoto
        ? <Image source={{ uri: coverPhoto.url }} style={styles.heroImage} resizeMode="cover" />
        : <View style={[styles.heroImage, styles.heroPlaceholder]} />}
      <View style={[styles.heroNav, { top: topInset + SPACING.sm }]}>
        <Pressable style={styles.navBtn} onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={20} color={DARK.text} />
        </Pressable>
        <Pressable style={styles.navBtn} onPress={onSave} hitSlop={8} accessibilityRole="button" accessibilityLabel={saved ? t('directory.saved') : t('directory.save')}>
          {saved ? <Heart size={20} color={DARK.text} weight="fill" /> : <HeartStraight size={20} color={DARK.text} />}
        </Pressable>
      </View>
    </View>
  );
}

function ShopTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: 'menu' | 'reviews';
  onTabChange: (tab: 'menu' | 'reviews') => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.tabBar}>
      {(['menu', 'reviews'] as const).map(tab => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => onTabChange(tab)}
          accessibilityRole="tab"
          accessibilityLabel={tab === 'menu' ? t('directory.menu') : t('directory.reviews_tab')}
          accessibilityState={{ selected: activeTab === tab }}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'menu' ? t('directory.menu') : t('directory.reviews_tab')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ShopInfoSection({ shop, isAr }: { shop: Shop; isAr: boolean }) {
  const { t } = useTranslation();
  const displayName = isAr ? shop.nameAr : shop.name;
  const description = isAr ? shop.descriptionAr : shop.description;

  return (
    <View style={styles.info}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{displayName}</Text>
        <View style={[styles.statusBadge, shop.isOpen ? styles.badgeOpen : styles.badgeClosed]}>
          <Text style={styles.statusText}>
            {shop.isOpen ? t('common.open') : t('common.closed')}
          </Text>
        </View>
      </View>
      {shop.averageRating !== null && (
        <View style={styles.ratingRow}>
          <Star size={14} weight="fill" color={BRAND.gold} />
          <Text style={styles.rating}>
            {shop.averageRating.toFixed(1)}
            {' '}
            ·
            {' '}
            {shop.reviewCount}
            {' '}
            {t('directory.reviews_tab').toLowerCase()}
          </Text>
        </View>
      )}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.ctaRow}>
        {shop.phone
          ? (
              <Pressable style={styles.ctaBtn} onPress={() => { if (shop?.phone) Linking.openURL(`tel:${shop.phone}`); }} accessibilityRole="button" accessibilityLabel={t('directory.call')}>
                <Phone size={16} color={DARK.text} />
                <Text style={styles.ctaBtnText}>
                  {t('directory.call')}
                </Text>
              </Pressable>
            )
          : null}
        {shop.whatsapp
          ? (
              <Pressable
                style={[styles.ctaBtn, styles.ctaBtnWhatsapp]}
                onPress={() => Linking.openURL(`https://wa.me/${shop.whatsapp}`)}
                accessibilityRole="button"
                accessibilityLabel="WhatsApp"
              >
                <ChatCircle size={16} color={DARK.text} />
                <Text style={styles.ctaBtnText}>WhatsApp</Text>
              </Pressable>
            )
          : null}
      </View>
    </View>
  );
}

function MenuTabContent({ shopId, shopName }: { shopId: string; shopName: string }) {
  const { t, i18n } = useTranslation();

  const isAr = i18n.language === 'ar';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    any,
    Error,
    any,
    string[],
    string | undefined
  >({
    queryKey: ['shop-products', shopId],
    queryFn: ({ pageParam }) => shopsApi.getProducts(shopId, { cursor: pageParam, limit: 20 }),
    getNextPageParam: (last: any) => last.data.data.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const products = data?.pages.flatMap((p: any) => p.data.data.data) ?? [];

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`product-skeleton-${i}`} width="100%" height={96} borderRadius={8} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={products}
      keyExtractor={(item: any) => item.id}
      estimatedItemSize={80}
      contentContainerStyle={{ padding: SPACING.base }}
      renderItem={({ item }: { item: any }) => (
        <ProductRow product={item} isAr={isAr} shopId={shopId} shopName={shopName} />
      )}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.emptyTab}>
          <Text style={styles.emptyText}>{t('common.no_results')}</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage
          ? <Skeleton width="100%" height={48} borderRadius={8} style={{ marginTop: SPACING.sm }} />
          : null
      }
    />
  );
}

function ProductRow({
  product,
  isAr,
  shopId,
  shopName,
}: {
  product: any;
  isAr: boolean;
  shopId: string;
  shopName: string;
}) {
  const { t } = useTranslation();
  const { requireAuth } = useAuthGuard();
  const dispatch = useAppDispatch();
  const name = isAr ? product.nameAr : product.name;
  const desc = isAr ? product.descriptionAr : product.description;

  function handleAddToCart() {
    requireAuth(() => {
      dispatch(addItem({
        item: { productId: product.id, name: product.name, nameAr: product.nameAr, price: product.price, quantity: 1, imageUrl: product.imageUrl ?? null },
        shopId,
        shopName,
      }));
    });
  }

  return (
    <View style={styles.productRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{name}</Text>
        {desc ? <Text style={styles.productDesc} numberOfLines={2}>{desc}</Text> : null}
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
      </View>
      <View style={styles.productRight}>
        {product.imageUrl
          ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
            )
          : null}
        <Pressable style={styles.addBtn} onPress={handleAddToCart} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('directory.add_to_cart')}>
          <Plus size={20} color={DARK.bg} />
        </Pressable>
      </View>
    </View>
  );
}

function ReviewsTabContent({ shopId }: { shopId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
    any,
    Error,
    any,
    string[],
    string | undefined
  >({
    queryKey: ['shop-reviews', shopId],
    queryFn: ({ pageParam }) => shopsApi.getReviews(shopId, { cursor: pageParam, limit: 20 }),
    getNextPageParam: (last: any) => last.data.data.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const reviews = data?.pages.flatMap((p: any) => p.data.data.data) ?? [];

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`review-skeleton-${i}`} width="100%" height={80} borderRadius={8} style={{ marginBottom: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={reviews}
      keyExtractor={(item: any) => item.id}
      estimatedItemSize={80}
      contentContainerStyle={{ padding: SPACING.base }}
      renderItem={({ item: r }: { item: any }) => (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>{r.user.name}</Text>
            <View style={styles.reviewStars}>
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} size={12} weight="fill" color={BRAND.gold} />
              ))}
            </View>
          </View>
          {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
        </View>
      )}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.emptyTab}>
          <Text style={styles.emptyText}>{t('common.no_results')}</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage
          ? <Skeleton width="100%" height={48} borderRadius={8} style={{ marginTop: SPACING.sm }} />
          : null
      }
    />
  );
}

function CartBar({ shopId, bottomInset }: { shopId: string; bottomInset: number }) {
  const { t } = useTranslation();
  const { items, shopId: cartShopId } = useAppSelector(s => s.cart);

  if (cartShopId !== shopId || !items.length)
    return null;

  const count = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

  return (
    <Pressable
      style={[styles.cartBar, { paddingBottom: bottomInset + SPACING.sm }]}
      onPress={() => router.push('/checkout/cart' as any)}
      accessibilityRole="button"
      accessibilityLabel={t('cart.checkout')}
    >
      <View style={styles.cartBarBadge}>
        <Text style={styles.cartBarBadgeText}>{count}</Text>
      </View>
      <Text style={styles.cartBarLabel}>{t('cart.checkout')}</Text>
      <Text style={styles.cartBarTotal}>{formatCurrency(total)}</Text>
    </Pressable>
  );
}

function ShopDetailSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={240} borderRadius={0} />
      <View style={{ padding: SPACING.base, gap: SPACING.md }}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="40%" height={16} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="100%" height={14} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  hero: { width: '100%', height: 240, backgroundColor: DARK.elevated },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: DARK.elevated },
  heroNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,12,11,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  tab: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: BRAND.gold },
  tabText: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, fontWeight: '500' },
  tabTextActive: { color: BRAND.gold },
  info: { padding: SPACING.base, gap: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  name: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 22, color: DARK.text, flex: 1 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeOpen: { backgroundColor: SEMANTIC.success },
  badgeClosed: { backgroundColor: DARK.elevated, borderWidth: 1, borderColor: DARK.border },
  statusText: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 11, color: DARK.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  rating: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted },
  description: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22 },
  ctaRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  ctaBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: DARK.card,
    borderWidth: 1,
    borderColor: DARK.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBtnWhatsapp: { borderColor: '#25D366' }, // WhatsApp brand green — intentional
  ctaBtnText: { fontFamily: FONT.sans, fontSize: 14, color: DARK.text, fontWeight: '500' },
  tabContent: { padding: SPACING.base, gap: SPACING.sm },
  emptyTab: { padding: SPACING['3xl'], alignItems: 'center' },
  emptyText: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted },
  productRow: {
    flexDirection: 'row',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  productInfo: { flex: 1, gap: SPACING.xs },
  productName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 15, color: DARK.text },
  productDesc: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, lineHeight: 20 },
  productPrice: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: BRAND.gold },
  productRight: { alignItems: 'center', gap: SPACING.xs },
  productImage: { width: 72, height: 72, borderRadius: RADIUS.sm },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontFamily: FONT.sans, fontSize: 14, color: DARK.textMuted, lineHeight: 22 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  cartBarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBarBadgeText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 13, color: DARK.text },
  cartBarLabel: { flex: 1, fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.bg },
  cartBarTotal: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 15, color: DARK.bg },
});
