import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';

export default function ErrorScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <ErrorState
          title={t('app.error.title')}
          description={t('app.error.description')}
          actionLabel={t('app.error.action')}
          onAction={() => router.replace('/')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
