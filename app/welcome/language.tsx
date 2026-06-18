import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '@/src/components/brand';
import { Screen } from '@/src/components/layout';
import { AppText, Button, Card } from '@/src/components/ui';
import { useAppTheme, useLocalization } from '@/src/presentation';
import type { SupportedLocale } from '@/src/localization';

const languageOptions: {
  locale: SupportedLocale;
  titleKey: string;
  subtitleKey: string;
}[] = [
  { locale: 'en', titleKey: 'welcome.english', subtitleKey: 'welcome.englishDescription' },
  { locale: 'pt-BR', titleKey: 'welcome.portuguese', subtitleKey: 'welcome.portugueseDescription' },
];

export default function LanguageWelcomeRoute() {
  const { theme } = useAppTheme();
  const { setLocale } = useLocalization();
  const { t } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setLocale(selectedLocale)
      .then(() => router.replace('/(tabs)'))
      .catch(() => setError(t('welcome.storageError')))
      .finally(() => setSubmitting(false));
  };

  return (
    <Screen>
      <View style={[styles.container, { gap: theme.spacing.xl }]}>
        <AppLogo size={96} />
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="heading1" align="center">{t('welcome.title')}</AppText>
          <AppText variant="heading2" align="center" color="textSecondary">{t('welcome.subtitle')}</AppText>
        </View>
        {error ? <AppText color="error" align="center">{error}</AppText> : null}
        <View style={{ gap: theme.spacing.md, width: '100%' }}>
          {languageOptions.map((option) => {
            const selected = option.locale === selectedLocale;
            const title = t(option.titleKey);
            const state = selected ? t('common.selected') : t('common.notSelected');
            return (
              <Pressable
                key={option.locale}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t('welcome.optionAccessibility', { language: title, state })}
                onPress={() => setSelectedLocale(option.locale)}>
                <Card variant={selected ? 'elevated' : 'outlined'}>
                  <View style={{ gap: theme.spacing.xs }}>
                    <AppText variant="heading3">{title}</AppText>
                    <AppText color="textSecondary">{t(option.subtitleKey)}</AppText>
                    {selected ? <AppText variant="caption" color="primary">{t('welcome.selected')}</AppText> : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
        <Button
          title={t('welcome.continue')}
          loading={submitting}
          accessibilityLabel={t('welcome.continue')}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 520,
    width: '100%',
  },
});
