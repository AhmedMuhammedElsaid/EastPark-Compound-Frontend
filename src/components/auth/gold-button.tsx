import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

type Variant = 'filled' | 'outline' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

/**
 * EastPark branded CTA button.
 * filled  → gold bg, dark text  (primary action)
 * outline → gold border, gold text (secondary)
 * ghost   → no border, gold text (link-style)
 */
export function GoldButton({
  label,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
  fullWidth = true,
}: Props) {
  const [pressed, setPressed] = React.useState(false);

  const containerStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    variant === 'filled' && (pressed ? styles.filledPressed : styles.filled),
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.label,
    variant === 'filled' && styles.filledText,
    variant === 'outline' && styles.outlineText,
    variant === 'ghost' && styles.ghostText,
    disabled && styles.disabledText,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.inner}>
        {loading
          ? (
              <ActivityIndicator
                color={variant === 'filled' ? DARK.bg : BRAND.gold}
                size="small"
              />
            )
          : (
              <Text style={textStyle}>{label}</Text>
            )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  fullWidth: { alignSelf: 'stretch' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

  // filled
  filled: { backgroundColor: BRAND.gold },
  filledPressed: { backgroundColor: BRAND.goldDark },
  filledText: { color: DARK.bg },

  // outline
  outline: {
    borderWidth: 1.5,
    borderColor: BRAND.gold,
    backgroundColor: 'transparent',
  },
  outlineText: { color: BRAND.gold },

  // ghost
  ghost: { backgroundColor: 'transparent' },
  ghostText: { color: DARK.textMuted },

  // disabled
  disabled: { opacity: 0.4 },
  disabledText: {},

  label: {
    fontFamily: FONT.sans,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
