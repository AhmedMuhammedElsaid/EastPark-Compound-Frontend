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

import { governanceApi } from '@/services/api/governance';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const optionSchema = z.object({ text: z.string().min(1), textAr: z.string().min(1) });
const schema = z.object({
  question: z.string().min(5),
  questionAr: z.string().min(5),
  options: z.array(optionSchema).min(2),
  expiresAt: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function NewPollScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [optionCount, setOptionCount] = React.useState(2);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: '',
      questionAr: '',
      options: [{ text: '', textAr: '' }, { text: '', textAr: '' }],
      expiresAt: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => governanceApi.createPoll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      showMessage({ message: t('admin.poll_created'), type: 'success', backgroundColor: SEMANTIC.success });
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
        <Text style={styles.navTitle}>{t('admin.new_poll')}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Text style={styles.label}>{t('admin.question_en')}</Text>
        <Controller control={control} name="question" render={({ field }) => (
          <TextInput style={[styles.input, errors.question && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.question_en')} />
        )} />

        <Text style={styles.label}>{t('admin.question_ar')}</Text>
        <Controller control={control} name="questionAr" render={({ field }) => (
          <TextInput style={[styles.input, errors.questionAr && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={t('admin.question_ar')} textAlign="right" />
        )} />

        <Text style={styles.label}>{t('admin.expires_at')}</Text>
        <Controller control={control} name="expiresAt" render={({ field }) => (
          <TextInput style={[styles.input, errors.expiresAt && styles.inputError]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder="YYYY-MM-DD" />
        )} />

        <Text style={styles.label}>{t('admin.options')}</Text>
        {Array.from({ length: optionCount }).map((_, i) => (
          <View key={i} style={styles.optionRow}>
            <Controller control={control} name={`options.${i}.text`} render={({ field }) => (
              <TextInput style={[styles.input, styles.optionInput]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={`${t('admin.option')} ${i + 1} (EN)`} />
            )} />
            <Controller control={control} name={`options.${i}.textAr`} render={({ field }) => (
              <TextInput style={[styles.input, styles.optionInput]} value={field.value} onChangeText={field.onChange} placeholderTextColor={DARK.textMuted} placeholder={`${t('admin.option')} ${i + 1} (AR)`} textAlign="right" />
            )} />
          </View>
        ))}
        {optionCount < 6 && (
          <Pressable style={styles.addOptionBtn} onPress={() => setOptionCount(c => c + 1)}>
            <Text style={styles.addOptionText}>+ {t('admin.add_option')}</Text>
          </Pressable>
        )}

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
  optionRow: { gap: SPACING.xs, marginBottom: SPACING.sm },
  optionInput: { flex: 1 },
  addOptionBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  addOptionText: { fontFamily: FONT.sans, fontSize: 14, color: BRAND.gold, fontWeight: '600' },
  submitBtn: { height: 52, borderRadius: RADIUS.md, backgroundColor: BRAND.gold, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
