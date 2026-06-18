import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { AppText } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export interface BookCoverProps {
  url: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 52, height: 76 },
  md: { width: 72, height: 104 },
  lg: { width: 112, height: 164 },
};

export function BookCover({ url, title, size = 'md' }: BookCoverProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const dimensions = sizes[size];
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <Image
        source={{ uri: url }}
        resizeMode="cover"
        accessibilityLabel={t('library.screen.coverAccessibility', { title })}
        onError={() => setFailed(true)}
        style={[
          styles.cover,
          dimensions,
          {
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.surfaceSecondary,
          },
        ]}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={t('library.screen.coverUnavailableAccessibility', { title })}
      style={[
        styles.placeholder,
        dimensions,
        {
          borderRadius: theme.radii.sm,
          backgroundColor: theme.colors.surfaceSecondary,
        },
      ]}>
      <AppText variant="caption" align="center" color="textSecondary">
        {t('library.screen.noCover')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
