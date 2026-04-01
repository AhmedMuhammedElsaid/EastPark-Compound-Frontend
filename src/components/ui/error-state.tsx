import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './text';
import { DARK, SEMANTIC, SPACING, RADIUS, FONT } from '@/theme/tokens';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <WarningCircle size={48} color={SEMANTIC.error} />
      <Text style={styles.message}>
        {message ?? t('common.error')}
      </Text>
      {onRetry && (
        <Pressable
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
        >
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  message: {
    fontFamily: FONT.sans,
    fontSize: 15,
    color: DARK.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  retryText: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.text,
  },
});
