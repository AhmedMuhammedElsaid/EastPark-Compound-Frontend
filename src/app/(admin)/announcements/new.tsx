import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const schema = z.object({
  title: z.string().min(3),
  titleAr: z.string().min(3),
  body: z.string().min(10),
  bodyAr: z.string().min(10),
  category: z.enum(['GENERAL', 'PROMOTION', 'EVENT', 'MAINTENANCE', 'NEWS']),
});
type FormValues = z.infer<typeof schema>;

const CATEGORIES = ['GENERAL', 'PROMOTION', 'EVENT', 'MAINTENANCE', 'NEWS'] as const;

export default function NewAnnouncementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', titleAr: '', body: '', bodyAr: '', category: 'GENERAL' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => communityApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showMessage({ message: t('admin.announcement_created'), type: 'success', backgroundColor: SEMANTIC.success });
      router.back();
    },
    onError: () => {
      showMessage({ message: t('common.error'), type: 'danger', backgroundColor: SEMANTIC.error });
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('admin.new_announcement')}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Text style={styles.label}>{t('admin.title_en')}</Text>
        <Controller control={control} name="title" render={({ field }) => (
          <TextInput style={[styles.input, errors.title && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.title_en')} />
        )} />

        <Text style={styles.label}>{t('admin.title_ar')}</Text>
        <Controller control={control} name="titleAr" render={({ field }) => (
          <TextInput style={[styles.input, errors.titleAr && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.title_ar')} textAlign="right" />
        )} />

        <Text style={styles.label}>{t('admin.body_en')}</Text>
        <Controller control={control} name="body" render={({ field }) => (
          <TextInput style={[styles.input, styles.textarea, errors.body && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.body_en')} multiline />
        )} />

        <Text style={styles.label}>{t('admin.body_ar')}</Text>
        <Controller control={control} name="bodyAr" render={({ field }) => (
          <TextInput style={[styles.input, styles.textarea, errors.bodyAr && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.body_ar')} multiline textAlign="right" />
        )} />

        <Text style={styles.label}>{t('admin.category')}</Text>
        <Controller control={control} name="category" render={({ field }) => (
          <View style={styles.chips}>
            {CATEGORIES.map(cat => (
              <Pressable key={cat} style={[styles.chip, field.value === cat && styles.chipActive]} onPress={() => field.onChange(cat)}>
                <Text style={[styles.chipText, field.value === cat && styles.chipTextActive]}>{t(`community.${cat}`)}</Text>
              </Pressable>
            ))}
          </View>
        )} />

        <Pressable style={[styles.submitBtn, isPending && styles.submitBtnDisabled]} onPress={handleSubmit(d => mutate(d))} disabled={isPending}>
          <Text style={styles.submitBtnText}>{isPending ? t('common.loading') : t('common.submit')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: DARK.card, borderBottomWidth: 1, borderBottomColor: DARK.border, gap: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: DARK.elevated, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 16, color: DARK.text },
  navTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  scroll: { padding: SPACING.base, gap: SPACING.sm },
  label: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.textMuted, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { backgroundColor: DARK.card, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontFamily: FONT.sans, fontSize: 14, color: DARK.text, borderWidth: 1, borderColor: DARK.border },
  inputError: { borderColor: SEMANTIC.error },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: DARK.elevated, borderWidth: 1, borderColor: DARK.border },
  chipActive: { backgroundColor: BRAND.gold, borderColor: BRAND.gold },
  chipText: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted },
  chipTextActive: { color: DARK.bg, fontWeight: '700' },
  submitBtn: { height: 52, borderRadius: RADIUS.md, backgroundColor: BRAND.gold, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
