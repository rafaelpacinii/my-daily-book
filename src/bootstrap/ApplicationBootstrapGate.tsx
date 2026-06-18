import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '@/src/components/brand';
import { ErrorState, LoadingState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { AppText } from '@/src/components/ui';
import { mapApplicationErrorToMessage, useApplication, useAppTheme } from '@/src/presentation';

export function ApplicationBootstrapGate({ children }: PropsWithChildren) {
  const { status, initializationError, retry } = useApplication();
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  if (status === 'ready') {
    return <>{children}</>;
  }

  if (status === 'error') {
    const message = mapApplicationErrorToMessage(initializationError);

    return (
      <Screen scroll={false}>
        <View style={[styles.center, { gap: theme.spacing.xl }]}>
          <AppLogo size={112} />
          <ErrorState
            title={message.title}
            description={message.description}
            actionLabel={t('bootstrap.retry')}
            onAction={retry}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={[styles.center, { gap: theme.spacing.xl }]}>
        <AppLogo size={128} />
        <View style={styles.copy}>
          <AppText variant="heading2" align="center">
            My Daily Book
          </AppText>
          <AppText color="textSecondary" align="center">
            {t('bootstrap.preparingLibrary')}
          </AppText>
        </View>
        <LoadingState />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  copy: {
    gap: 6,
  },
});
