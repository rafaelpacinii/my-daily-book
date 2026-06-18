import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { readingCycleRoute } from '@/src/presentation/navigation/routes';

import { ReadingFormField } from '../components';
import { formatPagesRead, toLocalCivilDate } from '../reading-formatters';
import {
  mapReadingCycle,
  mapReadingLogSummary,
} from '../reading-mappers';
import type { ReadingCycleViewModel, ReadingLogViewModel } from '../reading-types';
import {
  createInitialReadingLogForm,
  validateReadingLogForm,
  type ReadingLogFormState,
} from './reading-log-validation';
import { mapReadingErrorMessage } from '../reading-error-messages';

export function ReadingLogScreen({
  readingCycleId,
  readingLogId,
}: {
  readingCycleId?: string;
  readingLogId?: string;
}) {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('reading.log.loading')} />;
  }

  return <ReadingLogContent api={api} readingCycleId={readingCycleId} readingLogId={readingLogId} />;
}

function ReadingLogContent({
  api,
  readingCycleId,
  readingLogId,
}: {
  api: ApplicationApi;
  readingCycleId?: string;
  readingLogId?: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<ReadingCycleViewModel | null>(null);
  const [log, setLog] = useState<ReadingLogViewModel | null>(null);
  const [form, setForm] = useState<ReadingLogFormState>(() => createInitialReadingLogForm({}));
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isEditing = Boolean(readingLogId);

  const load = useCallback(() => {
    setStatus('loading');

    const loadPromise = readingLogId
      ? Promise.resolve(api.reading.getLogDetails(readingLogId)).then((summary) => {
        const mappedLog = mapReadingLogSummary(summary);
        const mappedCycle = mapReadingCycle(api.reading.getCycleDetails(summary.log.readingCycleId));
        return { mappedLog, mappedCycle };
      })
      : Promise.resolve(api.reading.getCycleDetails(readingCycleId ?? '')).then((details) => ({
        mappedLog: null,
        mappedCycle: mapReadingCycle(details),
      }));

    loadPromise
      .then(({ mappedLog, mappedCycle }) => {
        setLog(mappedLog);
        setCycle(mappedCycle);
        setForm(createInitialReadingLogForm({
          today: toLocalCivilDate(),
          previousEndPage: mappedCycle.currentPage,
          log: mappedLog,
        }));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        setStatus('error');
      });
  }, [api, readingCycleId, readingLogId]);

  useEffect(() => {
    load();
  }, [load]);

  const pagesReadLabel = useMemo(() => {
    const startPage = Number(form.startPage);
    const endPage = Number(form.endPage);

    if (!Number.isInteger(startPage) || !Number.isInteger(endPage) || endPage < startPage) {
      return null;
    }

    return formatPagesRead(endPage - startPage + 1);
  }, [form.endPage, form.startPage]);

  const confirm = useCallback((message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      onConfirm();
      return;
    }

    Alert.alert(t('reading.log.confirmSaveTitle'), message, [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('reading.log.confirmSaveAction'), onPress: onConfirm },
    ]);
  }, [t]);

  const submit = useCallback((overrides: {
    allowDiscontinuousPages?: boolean;
    allowOverlappingPages?: boolean;
  } = {}) => {
    if (!cycle || submittingRef.current) return;

    const validation = validateReadingLogForm(form, { pageCount: cycle.pageCount });
    if (!validation.valid || !validation.input) {
      setFormError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    const action = isEditing && readingLogId
      ? api.reading.updateLog({
        id: readingLogId,
        ...validation.input,
        ...overrides,
      })
      : api.reading.createLog({
        readingCycleId: cycle.id,
        ...validation.input,
        ...overrides,
      });

    Promise.resolve(action)
      .then((result) => {
        router.replace(readingCycleRoute(result.readingLog.readingCycleId));
      })
      .catch((nextError: unknown) => {
        const message = nextError instanceof Error ? nextError.message : mapReadingErrorMessage(nextError, 'saveLog');
        if (message.includes('discontinuous') && !overrides.allowDiscontinuousPages) {
          submittingRef.current = false;
          setSubmitting(false);
          confirm(t('reading.log.confirmGapMessage'), () => {
            submit({ ...overrides, allowDiscontinuousPages: true });
          });
          return;
        }

        if (message.includes('overlap') && !overrides.allowOverlappingPages) {
          submittingRef.current = false;
          setSubmitting(false);
          confirm(t('reading.log.confirmOverlapMessage'), () => {
            submit({ ...overrides, allowOverlappingPages: true });
          });
          return;
        }

        setFormError(mapReadingErrorMessage(nextError, 'saveLog'));
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, confirm, cycle, form, isEditing, readingLogId, t]);

  const deleteLog = useCallback(() => {
    if (!log) return;

    const runDelete = () => {
      setSubmitting(true);
          setFormError(null);
      Promise.resolve(api.reading.deleteLog(log.id))
        .then((deleted) => {
          router.replace(readingCycleRoute(deleted.readingCycleId));
        })
        .catch((nextError: unknown) => {
          setFormError(mapReadingErrorMessage(nextError, 'deleteLog'));
        })
        .finally(() => setSubmitting(false));
    };

    if (Platform.OS === 'web') {
      runDelete();
      return;
    }

    Alert.alert(t('reading.log.confirmDeleteTitle'), t('reading.log.confirmDeleteMessage'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.delete'), style: 'destructive', onPress: runDelete },
    ]);
  }, [api, log, t]);

  if (status === 'loading') {
    return <Screen loading loadingMessage={t('reading.log.loading')} />;
  }

  if (status === 'error' || !cycle) {
    return (
      <Screen
        header={
          <AppHeader
            title={isEditing ? t('reading.log.editTitle') : t('reading.log.createTitle')}
            leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          />
        }>
        <ErrorState
          title={t('reading.log.loadErrorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={load}
        />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={
        <AppHeader
          title={isEditing ? t('reading.log.editTitle') : t('reading.log.createTitle')}
          subtitle={cycle.title}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <Card variant="outlined">
        <AppText variant="heading3">{cycle.editionTitle}</AppText>
        <AppText color="textSecondary">
          {cycle.currentPageLabel} - {cycle.pageCountLabel}
        </AppText>
      </Card>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.log.pagesSection')} />
        <ReadingFormField
          label={t('reading.log.readingDate')}
          value={form.readingDate}
          onChangeText={(readingDate) => setForm((current) => ({ ...current, readingDate }))}
          placeholder={t('reading.start.datePlaceholder')}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <ReadingFormField
              label={t('reading.log.startPage')}
              value={form.startPage}
              onChangeText={(startPage) => setForm((current) => ({ ...current, startPage }))}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ReadingFormField
              label={t('reading.log.endPage')}
              value={form.endPage}
              onChangeText={(endPage) => setForm((current) => ({ ...current, endPage }))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        {pagesReadLabel ? <AppText color="textSecondary">{t('reading.log.pagesRead', { value: pagesReadLabel })}</AppText> : null}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.log.durationSection')} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <ReadingFormField
              label={t('reading.log.hours')}
              value={form.durationHours}
              onChangeText={(durationHours) => setForm((current) => ({ ...current, durationHours }))}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ReadingFormField
              label={t('reading.log.minutes')}
              value={form.durationMinutes}
              onChangeText={(durationMinutes) => setForm((current) => ({ ...current, durationMinutes }))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <ReadingFormField
          label={t('reading.log.notes')}
          value={form.notes}
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
          multiline
        />
      </View>

      {formError ? <AppText color="error">{formError}</AppText> : null}

      <Button
        title={isEditing ? t('reading.log.saveChangesAction') : t('reading.log.saveAction')}
        loading={submitting}
        onPress={() => submit()}
        fullWidth
      />
      {isEditing ? (
        <Button
          title={t('reading.log.deleteAction')}
          variant="danger"
          loading={submitting}
          onPress={deleteLog}
          fullWidth
        />
      ) : null}
    </Screen>
  );
}
