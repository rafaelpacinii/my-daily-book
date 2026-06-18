import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { Button, Card } from '@/src/components/ui';

export default function ModalScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Card variant="elevated">
          <EmptyState
            icon="information-circle-outline"
            title={t('app.modal.title')}
            description={t('app.modal.description')}
          />
          <Button title={t('common.actions.close')} variant="primary" onPress={() => router.dismiss()} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
});
