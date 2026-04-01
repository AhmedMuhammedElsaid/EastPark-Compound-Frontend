import type { AxiosResponse } from 'axios';
import type { Report } from '@/services/api/community';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/skeleton';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SPACING } from '@/theme/tokens';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAr = i18n.language === 'ar';

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isRefetching, refetch }
    = useInfiniteQuery<
      AxiosResponse<{ data: { data: Report[]; nextCursor: string | null } }>,
      Error,
      { pages: AxiosResponse<{ data: { data: Report[]; nextCursor: string | null } }>[] },
      string[],
      string | undefined
    >({
      queryKey: ['reports'],
      queryFn: ({ pageParam }) => communityApi.getReports({ cursor: pageParam, limit: 20 }),
      getNextPageParam: last => last.data.data.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const reports = data?.pages.flatMap(p => p.data.data.data) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('community.reports')}</Text>
      </View>

      {isLoading
        ? (
            <View style={styles.loadingPad}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`report-sk-${i}`} width="100%" height={80} borderRadius={RADIUS.md} style={{ marginBottom: 12 }} />
              ))}
            </View>
          )
        : (
            <FlashList
              data={reports}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ReportRow report={item} isAr={isAr} />}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage)
                  fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContent}
              onRefresh={refetch}
              refreshing={isRefetching}
              ListEmptyComponent={(
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>{t('community.no_reports')}</Text>
                </View>
              )}
              ListFooterComponent={
                isFetchingNextPage
                  ? <Skeleton width="100%" height={80} borderRadius={RADIUS.md} />
                  : null
              }
            />
          )}
    </View>
  );
}

function ReportRow({ report, isAr }: { report: Report; isAr: boolean }) {
  const { t } = useTranslation();
  const title = isAr ? report.titleAr : report.title;
  const date = new Date(report.publishedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable style={styles.row} onPress={() => Linking.openURL(report.pdfUrl)} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.rowIcon}>
        <Text style={styles.pdfIcon}>📄</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.rowDate}>{date}</Text>
      </View>
      <Text style={styles.viewLabel}>{t('community.view_pdf')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
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
  title: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  loadingPad: { padding: SPACING.base },
  listContent: { padding: SPACING.base },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FONT.sans, fontSize: 15, color: DARK.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: DARK.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIcon: { fontSize: 22 },
  rowContent: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text, lineHeight: 20 },
  rowDate: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  viewLabel: { fontFamily: FONT.sans, fontSize: 12, color: BRAND.gold, fontWeight: '600' },
});
