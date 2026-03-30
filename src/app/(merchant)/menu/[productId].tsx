import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { merchantApi } from '@/services/api/merchant';
import { BRAND, DARK, FONT, RADIUS, SEMANTIC, SPACING } from '@/theme/tokens';

const schema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  price: z.coerce.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function ProductFormScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isNew = productId === 'new';

  const { data } = useQuery({
    queryKey: ['merchant-product', productId],
    queryFn: () => merchantApi.getMyProducts({ limit: 100, includeUnavailable: true }),
    enabled: !isNew,
    select: res => res.data.data.data.find(p => p.id === productId),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      imageUrl: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        nameAr: data.nameAr,
        description: data.description ?? '',
        descriptionAr: data.descriptionAr ?? '',
        price: data.price,
        imageUrl: data.imageUrl ?? '',
      });
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormData) => {
      const payload = {
        name: values.name,
        nameAr: values.nameAr,
        description: values.description || undefined,
        descriptionAr: values.descriptionAr || undefined,
        price: values.price,
        imageUrl: values.imageUrl || undefined,
      };
      return isNew
        ? merchantApi.createProduct(payload)
        : merchantApi.updateProduct(productId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
      router.back();
    },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>{isNew ? 'New Product' : t('common.save')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <ProductFields control={control} errors={errors} />

        <Pressable
          style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
          onPress={handleSubmit((d: FormData) => mutate(d))}
          disabled={isPending}
        >
          <Text style={styles.saveBtnText}>{isPending ? t('common.loading') : t('common.save')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Form fields sub-component ────────────────────────────────────────────────

function ProductFields({ control, errors }: { control: any; errors: any }) {
  return (
    <>
      <PField control={control} name="name" label="Name (EN)" error={errors.name?.message} />
      <PField control={control} name="nameAr" label="Name (AR)" error={errors.nameAr?.message} rtl />
      <PField control={control} name="price" label="Price (EGP)" error={errors.price?.message} keyboardType="decimal-pad" />
      <PField control={control} name="description" label="Description (EN)" error={errors.description?.message} multiline />
      <PField control={control} name="descriptionAr" label="Description (AR)" error={errors.descriptionAr?.message} multiline rtl />
      <PField control={control} name="imageUrl" label="Image URL" error={errors.imageUrl?.message} keyboardType="url" />
    </>
  );
}

function PField({
  control,
  name,
  label,
  error,
  multiline,
  rtl,
  keyboardType,
}: {
  control: any;
  name: string;
  label: string;
  error?: string;
  multiline?: boolean;
  rtl?: boolean;
  keyboardType?: any;
}) {
  const { field } = useController({ control, name });
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(field.value ?? '')}
        onChangeText={field.onChange}
        onBlur={() => {
          field.onBlur();
          setIsFocused(false);
        }}
        onFocus={() => setIsFocused(true)}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlign={rtl ? 'right' : 'left'}
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
  section: { gap: SPACING.xs },
  label: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 13, color: DARK.text },
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
  inputMultiline: { height: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },
  inputFocused: { borderColor: BRAND.gold },
  inputError: { borderColor: SEMANTIC.error },
  errorText: { fontFamily: FONT.sans, fontSize: 12, color: SEMANTIC.error },
  saveBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 16, color: DARK.bg },
});
