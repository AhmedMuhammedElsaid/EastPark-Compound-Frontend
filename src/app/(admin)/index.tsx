import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

type QuickAction = { labelKey: string; icon: string; route: string };

const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: 'admin.invitations', icon: '✉️', route: '/(admin)/invitations' },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <Text style={styles.headerBadge}>{t('auth.role_admin')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <Text style={styles.sectionLabel}>{t('admin.tools')}</Text>
        {QUICK_ACTIONS.map(action => (
          <Pressable
            key={action.route}
            style={styles.actionRow}
            onPress={() => router.push(action.route as any)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{t(action.labelKey)}</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  headerTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 20, color: DARK.text },
  headerBadge: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 11,
    color: BRAND.goldText,
    backgroundColor: BRAND.goldTint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  scroll: { padding: SPACING.base, gap: SPACING.sm },
  sectionLabel: {
    fontFamily: FONT.sans,
    fontWeight: '700',
    fontSize: 12,
    color: DARK.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  actionIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  actionLabel: { flex: 1, fontFamily: FONT.sans, fontWeight: '500', fontSize: 15, color: DARK.text },
  actionChevron: { fontSize: 20, color: DARK.textMuted },
});
