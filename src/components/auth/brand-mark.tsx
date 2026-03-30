import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BRAND, DARK, FONT, SPACING } from '@/theme/tokens';

type Size = 'sm' | 'md' | 'lg';

type Props = { size?: Size };

/**
 * EastPark brand mark — vertical logo lockup.
 * Wordmark in Cormorant Garamond (display/hero English only — never in functional UI).
 * Caption "INTEGRATED COMMUNITY" in Cairo.
 */
export function BrandMark({ size = 'md' }: Props) {
  const titleSize = size === 'sm' ? 24 : size === 'md' ? 32 : 40;
  const captionSize = size === 'sm' ? 9 : size === 'md' ? 10 : 12;

  return (
    <View style={styles.container}>
      {/* Diamond mark — geometric approximation */}
      <View style={[styles.diamond, size === 'sm' && styles.diamondSm, size === 'lg' && styles.diamondLg]}>
        <View style={[styles.diamondInner, size === 'sm' && styles.diamondInnerSm]} />
      </View>

      <Text style={[styles.wordmark, { fontSize: titleSize }]}>EAST PARK</Text>
      <Text style={[styles.caption, { fontSize: captionSize, letterSpacing: captionSize * 0.25 }]}>
        INTEGRATED COMMUNITY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: SPACING.xs },

  diamond: {
    width: 40,
    height: 40,
    backgroundColor: BRAND.gold,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  diamondSm: { width: 28, height: 28 },
  diamondLg: { width: 52, height: 52 },
  diamondInner: {
    width: 16,
    height: 16,
    backgroundColor: DARK.bg,
    transform: [{ rotate: '0deg' }],
  },
  diamondInnerSm: { width: 10, height: 10 },

  wordmark: {
    fontFamily: FONT.display,
    fontWeight: '400',
    color: DARK.text,
    letterSpacing: 6,
  },

  caption: {
    fontFamily: FONT.sans,
    fontWeight: '400',
    color: BRAND.gold,
    letterSpacing: 3,
    marginTop: 2,
  },
});
