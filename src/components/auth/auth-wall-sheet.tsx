import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/auth/brand-mark';
import { GoldButton } from '@/components/auth/gold-button';
import { useAppDispatch, useAppSelector } from '@/store';
import { hideAuthWall } from '@/store/slices/authSlice';
import { DARK, SPACING } from '@/theme/tokens';

/**
 * Global auth-wall bottom sheet.
 * Rendered once in _layout.tsx, controlled by Redux authSlice.showAuthWall.
 * When the user logs in via this sheet, the pending redirectAction auto-replays.
 */
export function AuthWallSheet() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const showAuthWall = useAppSelector(s => s.auth.showAuthWall);
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  React.useEffect(() => {
    if (showAuthWall) {
      bottomSheetRef.current?.present();
    }
    else {
      bottomSheetRef.current?.dismiss();
    }
  }, [showAuthWall]);

  function handleDismiss() {
    dispatch(hideAuthWall());
  }

  function handleLogin() {
    handleDismiss();
    router.push('/(auth)/login');
  }

  function handleRegister() {
    handleDismiss();
    router.push('/(auth)/register');
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['42%']}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      )}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.logoRow}>
          <BrandMark size="sm" />
        </View>

        <GoldButton
          label={t('auth.login')}
          onPress={handleLogin}
          variant="filled"
        />

        <GoldButton
          label={t('auth.register')}
          onPress={handleRegister}
          variant="outline"
        />

        <GoldButton
          label={t('auth.continue_as_guest')}
          onPress={handleDismiss}
          variant="ghost"
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: DARK.elevated },
  handle: { backgroundColor: DARK.border, width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  logoRow: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
});
