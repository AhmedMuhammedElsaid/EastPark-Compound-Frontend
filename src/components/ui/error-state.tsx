import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { useAppColors } from '@/lib/hooks/use-app-colors';
import { Text } from './text';
import { SEMANTIC, SPACING, RADIUS, FONT } from '@/theme/tokens';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);

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

function useStyles(colors: ReturnType<typeof useAppColors>) {
  return React.useMemo(
    () =>
      StyleSheet.create({
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
          color: colors.textMuted,
          textAlign: 'center',
        },
        retryButton: {
          marginTop: SPACING.sm,
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.md,
          borderRadius: RADIUS.full,
          borderWidth: 1,
          borderColor: colors.border,
        },
        retryText: {
          fontFamily: FONT.sans,
          fontSize: 14,
          color: colors.text,
        },
      }),
    [colors],
  );
}
