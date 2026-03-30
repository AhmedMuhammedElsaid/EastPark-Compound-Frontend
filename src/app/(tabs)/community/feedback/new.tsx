import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import type { FeedbackCategory } from '@/services/api/community';
import { communityApi } from '@/services/api/community';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const CATEGORIES: FeedbackCategory[] = [
  'MAINTENANCE',
  'SECURITY',
  'CLEANLINESS',
  'NOISE',
  'SUGGESTION',
  'OTHER',
];

const schema = z.object({
  category: z.enum(['MAINTENANCE', 'SECURITY', 'CLEANLINESS', 'NOISE', 'SUGGESTION', 'OTHER']),
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(2000),
  isAnonymous: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function NewFeedbackScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'MAINTENANCE', title: '', body: '', isAnonymous: false },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => communityApi.submitFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      router.back();
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.nav, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{t('feedback.new')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryPickerField control={control} />
        <RhfTextInput control={control} name="title" label={t('feedback.feedback_title')} error={errors.title?.message} />
        <RhfTextInput control={control} name="body" label={t('feedback.feedback_body')} error={errors.body?.message} multiline />
        <AnonymousToggleField control={control} />

        <Pressable
          style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit((d) => mutate(d))}
          disabled={isPending}
        >
          <Text style={styles.submitBtnText}>
            {isPending ? t('common.loading') : t('common.submit')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Form field sub-components ────────────────────────────────────────────────

function CategoryPickerField({ control }: { control: any }) {
  const { t } = useTranslation();
  const { field } = useController({ control, name: 'category' });

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('feedback.category')}</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => {
          const active = field.value === cat;
          return (
            <Pressable
              key={cat}
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() => field.onChange(cat)}
            >
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                {t(`feedback.${cat}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RhfTextInput({
  control,
  name,
  label,
  error,
  multiline,
}: {
  control: any;
  name: string;
  label: string;
  error?: string;
  multiline?: boolean;
}) {
  const { field } = useController({ control, name });
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={field.value as string}
        onChangeText={field.onChange}
        onBlur={() => { field.onBlur(); setIsFocused(false); }}
        onFocus={() => setIsFocused(true)}
        placeholderTextColor={DARK.textMuted}
        placeholder={label}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function AnonymousToggleField({ control }: { control: any }) {
  const { t } = useTranslation();
  const { field } = useController({ control, name: 'isAnonymous' });

  return (
    <View style={styles.anonymousRow}>
      <View style={styles.anonymousText}>
        <Text style={styles.anonymousLabel}>{t('feedback.anonymous')}</Text>
        <Text style={styles.anonymousSubtitle}>{t('feedback.anonymous_subtitle')}</Text>
      </View>
      <Switch
        value={field.value as boolean}
        onValueChange={field.onChange}
        trackColor={{ true: BRAND.gold, false: DARK.elevated }}
        thumbColor={DARK.text}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    backgroundColor: DARK.card,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
    gap: SPACING.sm,
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
  navTitle: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 18, color: DARK.text },
  scroll: { padding: SPACING.base, gap: SPACING.md },
  section: { gap: SPACING.sm },
  label: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  catChipActive: { backgroundColor: BRAND.gold, borderColor: BRAND.gold },
  catChipText: { fontFamily: FONT.sans, fontSize: 13, color: DARK.textMuted, fontWeight: '500' },
  catChipTextActive: { color: DARK.bg },
  input: {
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONT.sans,
    fontSize: 14,
    color: DARK.text,
    height: 48,
  },
  inputMultiline: { height: 120, textAlignVertical: 'top', paddingTop: SPACING.md },
  inputFocused: { borderColor: BRAND.gold },
  inputError: { borderColor: SEMANTIC.error },
  errorText: { fontFamily: FONT.sans, fontSize: 12, color: SEMANTIC.error },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  anonymousText: { flex: 1, gap: 2 },
  anonymousLabel: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 14, color: DARK.text },
  anonymousSubtitle: { fontFamily: FONT.sans, fontSize: 12, color: DARK.textMuted },
  submitBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
