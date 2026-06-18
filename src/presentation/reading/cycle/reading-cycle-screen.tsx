import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button, Card, ProgressBar } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import {
  readingCycleLogRoute,
  readingLogEditRoute,
} from '@/src/presentation/navigation/routes';

import {
  ReadingFormField,
  ReadingLogCard,
  ReadingMetricRow,
  ReadingStatusBadge,
} from '../components';
import { toLocalCivilDate } from '../reading-formatters';
import { mapReadingCycle } from '../reading-mappers';
import type { ReadingCycleViewModel } from '../reading-types';
import {
  validateCompleteReadingForm,
  validateDropReadingForm,
  type CompleteReadingFormState,
  type DropReadingFormState,
} from './reading-cycle-validation';
import { mapReadingErrorMessage } from '../reading-error-messages';

export function ReadingCycleScreen({
  readingCycleId,
  readonly = false,
}: {
  readingCycleId: string;
  readonly?: boolean;
}) {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('reading.cycle.loading')} />;
  }

  return <ReadingCycleContent api={api} readingCycleId={readingCycleId} readonly={readonly} />;
}

function ReadingCycleContent({
  api,
  readingCycleId,
  readonly,
}: {
  api: ApplicationApi;
  readingCycleId: string;
  readonly: boolean;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<ReadingCycleViewModel | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completeForm, setCompleteForm] = useState<CompleteReadingFormState>({
    finishedAt: toLocalCivilDate(),
    rating: '',
    notes: '',
  });
  const [dropForm, setDropForm] = useState<DropReadingFormState>({
    droppedAt: toLocalCivilDate(),
    notes: '',
  });
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const cycleRef = useRef<ReadingCycleViewModel | null>(null);

  const load = useCallback(() => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setStatus(cycleRef.current ? 'success' : 'loading');
    setError(null);

    Promise.resolve(api.reading.getCycleDetails(readingCycleId))
      .then((details) => {
        if (!mountedRef.current) return;
        const viewModel = mapReadingCycle(details);
        cycleRef.current = viewModel;
        setCycle(viewModel);
        setCompleteForm({
          finishedAt: viewModel.lastReadAt ?? toLocalCivilDate(),
          rating: viewModel.rating == null ? '' : `${viewModel.rating}`,
          notes: viewModel.notes ?? '',
        });
        setDropForm({
          droppedAt: toLocalCivilDate(),
          notes: viewModel.notes ?? '',
        });
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setError(nextError);
        setStatus(cycleRef.current ? 'success' : 'error');
      })
      .finally(() => {
        if (!mountedRef.current) return;
        loadingRef.current = false;
      });
  }, [api, readingCycleId]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const confirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      onConfirm();
      return;
    }

    Alert.alert(title, message, [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.confirm'), style: 'destructive', onPress: onConfirm },
    ]);
  }, [t]);

  const complete = useCallback(() => {
    if (!cycle) return;
    const validation = validateCompleteReadingForm(completeForm);
    if (!validation.valid) {
      setActionError(validation.message);
      return;
    }

    confirm(
      t('reading.cycle.confirmCompleteTitle'),
      t('reading.cycle.confirmCompleteMessage', {
        currentPage: cycle.currentPageLabel,
        pageCount: cycle.pageCountLabel,
      }),
      () => {
      setSubmitting(true);
      setActionError(null);
      Promise.resolve(api.reading.completeCycle({
        id: cycle.id,
        finishedAt: completeForm.finishedAt,
        rating: validation.rating,
        notes: validation.notes,
      }))
        .then(() => load())
        .catch((nextError: unknown) => {
          setActionError(mapReadingErrorMessage(nextError, 'complete'));
        })
        .finally(() => setSubmitting(false));
      },
    );
  }, [api, completeForm, confirm, cycle, load, t]);

  const drop = useCallback(() => {
    if (!cycle) return;
    const validation = validateDropReadingForm(dropForm);
    if (!validation.valid) {
      setActionError(validation.message);
      return;
    }

    confirm(t('reading.cycle.confirmDropTitle'), t('reading.cycle.confirmDropMessage'), () => {
      setSubmitting(true);
      setActionError(null);
      Promise.resolve(api.reading.dropCycle({
        id: cycle.id,
        droppedAt: dropForm.droppedAt,
        notes: validation.notes,
      }))
        .then(() => load())
        .catch((nextError: unknown) => {
          setActionError(mapReadingErrorMessage(nextError, 'drop'));
        })
        .finally(() => setSubmitting(false));
    });
  }, [api, confirm, cycle, dropForm, load, t]);

  if (status === 'loading' || status === 'idle') {
    return <Screen loading loadingMessage={t('reading.cycle.loading')} />;
  }

  if (status === 'error' || !cycle) {
    return (
      <Screen
        header={
          <AppHeader
            title={t('reading.cycle.fallbackTitle')}
            leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          />
        }>
        <ErrorState
          title={t('reading.cycle.loadErrorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={load}
        />
      </Screen>
    );
  }

  const isActive = cycle.status === 'reading' && !readonly;

  return (
    <Screen
      keyboardAvoiding
      header={
        <AppHeader
          title={cycle.title}
          subtitle={`${cycle.cycleNumberLabel} - ${cycle.statusLabel}`}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      {error ? (
        <ErrorState
          title={t('reading.cycle.refreshErrorTitle')}
          description={t('reading.cycle.refreshErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={load}
        />
      ) : null}

      <Card variant="elevated">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <ReadingStatusBadge status={cycle.status} label={cycle.statusLabel} />
          <ReadingStatusBadge status="reading" label={cycle.cycleNumberLabel} />
        </View>
        <AppText variant="heading3">{cycle.editionTitle}</AppText>
        <AppText color="textSecondary">{cycle.authors}</AppText>
        <AppText color="textSecondary">{cycle.editionMeta}</AppText>
        <AppText color="textSecondary">{cycle.copyFormatLabel}</AppText>
        <View style={{ gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText>{cycle.currentPageLabel}</AppText>
            <AppText color="textSecondary">{cycle.progressLabel}</AppText>
          </View>
          <ProgressBar value={cycle.progressPercentage ?? 0} accessibilityLabel={t('reading.cycle.progressAccessibility')} />
          {cycle.progressPercentage == null ? (
            <AppText color="textSecondary">{t('reading.cycle.progressUnavailable')}</AppText>
          ) : null}
        </View>
        <ReadingMetricRow
          items={[
            { label: t('reading.cycle.started'), value: cycle.startedAtLabel },
            { label: t('reading.cycle.lastRead'), value: cycle.lastReadAtLabel },
            { label: t('reading.cycle.pages'), value: cycle.totalPagesReadLabel },
            { label: t('reading.cycle.duration'), value: cycle.totalDurationLabel },
          ]}
        />
        {cycle.finishedAtLabel ? <AppText>{t('reading.cycle.finishedAt', { date: cycle.finishedAtLabel })}</AppText> : null}
        {cycle.droppedAtLabel ? <AppText>{t('reading.cycle.droppedAt', { date: cycle.droppedAtLabel })}</AppText> : null}
        {cycle.notes ? <AppText color="textSecondary">{cycle.notes}</AppText> : null}
        {isActive ? (
          <Button title={t('reading.cycle.recordReading')} onPress={() => router.push(readingCycleLogRoute(cycle.id))} />
        ) : null}
      </Card>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.cycle.logs')} description={t('reading.cycle.records', { count: cycle.logs.length })} />
        {cycle.logs.length > 0 ? (
          cycle.logs.map((log) => (
            <ReadingLogCard
              key={log.id}
              log={log}
              onEdit={isActive ? () => router.push(readingLogEditRoute(log.id)) : undefined}
            />
          ))
        ) : (
          <Card variant="outlined">
            <EmptyState
              icon="calendar-outline"
              title={t('reading.cycle.emptyTitle')}
              description={t('reading.cycle.emptyDescription')}
              actionLabel={isActive ? t('reading.cycle.recordReading') : undefined}
              onAction={isActive ? () => router.push(readingCycleLogRoute(cycle.id)) : undefined}
            />
          </Card>
        )}
      </View>

      {isActive ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title={t('reading.cycle.completeSection')} />
          <Card variant="outlined">
            <AppText color="textSecondary">
              {t('reading.cycle.completeSummary', {
                currentPage: cycle.currentPageLabel,
                pageCount: cycle.pageCountLabel,
                lastRead: cycle.lastReadAtLabel,
              })}
            </AppText>
            <ReadingFormField
              label={t('reading.cycle.completionDate')}
              value={completeForm.finishedAt}
              onChangeText={(finishedAt) => setCompleteForm((current) => ({ ...current, finishedAt }))}
              placeholder={t('reading.start.datePlaceholder')}
            />
            <ReadingFormField
              label={t('reading.cycle.rating')}
              value={completeForm.rating}
              onChangeText={(rating) => setCompleteForm((current) => ({ ...current, rating }))}
              keyboardType="number-pad"
              placeholder={t('reading.cycle.ratingPlaceholder')}
            />
            <ReadingFormField
              label={t('reading.cycle.notes')}
              value={completeForm.notes}
              onChangeText={(notes) => setCompleteForm((current) => ({ ...current, notes }))}
              multiline
            />
            <Button title={t('reading.cycle.completeAction')} loading={submitting} onPress={complete} />
          </Card>

          <SectionHeader title={t('reading.cycle.dropSection')} />
          <Card variant="outlined">
            <ReadingFormField
              label={t('reading.cycle.dropDate')}
              value={dropForm.droppedAt}
              onChangeText={(droppedAt) => setDropForm((current) => ({ ...current, droppedAt }))}
              placeholder={t('reading.start.datePlaceholder')}
            />
            <ReadingFormField
              label={t('reading.cycle.notes')}
              value={dropForm.notes}
              onChangeText={(notes) => setDropForm((current) => ({ ...current, notes }))}
              multiline
            />
            <Button title={t('reading.cycle.dropAction')} variant="danger" loading={submitting} onPress={drop} />
          </Card>
          {actionError ? <AppText color="error">{actionError}</AppText> : null}
        </View>
      ) : null}
    </Screen>
  );
}
