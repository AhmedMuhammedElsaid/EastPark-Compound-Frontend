import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Shop } from '@/services/api/shops';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

type Props = { shop: Shop };

/**
 * Talabat-style shop card:
 * Cover image → [Open/Closed] pill → name → category · ⭐ rating → location
 * 12dp radius, gold-tinted shadow, skeleton shimmer on load (parent handles loading state).
 */
export function ShopCard({ shop }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const coverPhoto = shop.photos.find((p) => p.isPrimary) ?? shop.photos[0];
  const displayName = isAr ? shop.nameAr : shop.name;
  const categoryLabel = t(`directory.${shop.category.toLowerCase().replace('_and_', '_')}`);

  function handlePress() {
    router.push(`/(tabs)/directory/${shop.id}` as any);
  }

  return (
    <Pressable style={styles.card} onPress={handlePress} accessibilityRole="button">
      {/* Cover image */}
      <View style={styles.imageContainer}>
        {coverPhoto
          ? (
              <Image
                source={{ uri: coverPhoto.url }}
                style={styles.image}
                resizeMode="cover"
              />
            )
          : <View style={styles.imagePlaceholder} />}

        {/* Open/Closed badge */}
        <View style={[styles.badge, shop.isOpen ? styles.badgeOpen : styles.badgeClosed]}>
          <Text style={styles.badgeText}>
            {shop.isOpen ? t('common.open') : t('common.closed')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{categoryLabel}</Text>
          {shop.averageRating !== null && (
            <>
              <Text style={styles.dot}> · </Text>
              <Text style={styles.rating}>⭐ {shop.averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}> ({shop.reviewCount})</Text>
            </>
          )}
        </View>
        {!shop.isOpen && (
          <View style={styles.closedOverlay} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: BRAND.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: DARK.elevated,
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeOpen: { backgroundColor: SEMANTIC.success },
  badgeClosed: { backgroundColor: DARK.elevated, borderWidth: 1, borderColor: DARK.border },
  badgeText: {
    fontFamily: FONT.sans,
    fontWeight: '600',
    fontSize: 11,
    color: DARK.text,
    letterSpacing: 0.5,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.xs,
    position: 'relative',
  },
  name: {
    fontFamily: FONT.sans,
    fontWeight: '600',
    fontSize: 16,
    color: DARK.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontFamily: FONT.sans,
    fontSize: 13,
    color: DARK.textMuted,
  },
  dot: { color: DARK.textMuted, fontSize: 13 },
  rating: {
    fontFamily: FONT.sans,
    fontSize: 13,
    color: DARK.text,
  },
  reviewCount: {
    fontFamily: FONT.sans,
    fontSize: 12,
    color: DARK.textMuted,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,12,11,0.5)',
    borderRadius: RADIUS.md,
  },
});
