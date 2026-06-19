import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { BookCover, LibrarySearchInput } from '@/src/presentation/library/components';
import { readingGoalRoute } from '@/src/presentation/navigation/routes';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { getTodayCivilDate } from './goals-formatters';
import { mapLibraryBooksForGoalSelection } from './goals-mappers';
import type { ReadingGoalBooksViewModel } from './goals-types';
import {
  validateReadingGoalBooksForm,
  validateReadingGoalForm,
  type ReadingGoalFormState,
} from './goals-validation';

export function ReadingGoalFormScreen({ readingGoalId }: { readingGoalId?: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('goals.form.loading')} />;
  return <ReadingGoalFormContent api={api} readingGoalId={readingGoalId} />;
}

function ReadingGoalFormContent({
  api,
  readingGoalId,
}: {
  api: ApplicationApi;
  readingGoalId?: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const isEditing = Boolean(readingGoalId);
  const [form, setForm] = useState<ReadingGoalFormState>({
    name: '',
    description: '',
    startDate: getTodayCivilDate(),
    targetDate: getTodayCivilDate(),
  });
  const [booksViewModel, setBooksViewModel] = useState<ReadingGoalBooksViewModel>({
    books: [],
    existingBookIds: [],
  });
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(isEditing ? 'loading' : 'success');
  const [booksStatus, setBooksStatus] = useState<'loading' | 'success' | 'error'>(isEditing ? 'success' : 'loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!readingGoalId) return;

    Promise.resolve(api.goals.getGoalDetails(readingGoalId))
      .then((details) => {
        setForm({
          name: details.goal.name,
          description: details.goal.description ?? '',
          startDate: details.goal.startDate,
          targetDate: details.goal.targetDate,
        });
        setBooksViewModel((current) => ({
          ...current,
          existingBookIds: details.items.map(({ item }) => item.libraryBookId),
        }));
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [api, readingGoalId]);

  useEffect(() => {
    if (isEditing) return;

    setBooksStatus('loading');
    Promise.resolve(api.library.listBooks({ limit: 500, orderBy: 'title', orderDirection: 'asc' }))
      .then((page) => {
        setBooksViewModel({ books: mapLibraryBooksForGoalSelection(page.items), existingBookIds: [] });
        setBooksStatus('success');
      })
      .catch(() => setBooksStatus('error'));
  }, [api, isEditing]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return booksViewModel.books.filter((book) => {
      if (!normalizedQuery) return true;
      return [book.title, book.authors, book.statusLabel].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [booksViewModel.books, query]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;
    const formValidation = validateReadingGoalForm(form);
    if (!formValidation.valid || !formValidation.input) {
      setError(mapGoalFormMessage(formValidation.message, t));
      return;
    }

    const booksValidation = validateReadingGoalBooksForm({ selectedBookIds });
    if (!booksValidation.valid || !booksValidation.input) {
      setError(mapGoalFormMessage(booksValidation.message, t));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(booksValidation.input.recommendedMessage ? t('goals.form.recommendedMessage') : null);

    const action = isEditing && readingGoalId
      ? api.goals.updateGoal({ id: readingGoalId, ...formValidation.input })
      : api.goals.createGoal({
        ...formValidation.input,
        items: booksValidation.input.bookIds.map((libraryBookId, position) => ({
          libraryBookId,
          position,
        })),
      });

    Promise.resolve(action)
      .then((result) => router.replace(readingGoalRoute(result.readingGoal.id)))
      .catch(() => setError(t('goals.form.saveError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, form, isEditing, readingGoalId, selectedBookIds, t]);

  if (status === 'loading') return <Screen loading loadingMessage={t('goals.form.loading')} />;
  if (status === 'error') {
    return (
      <Screen header={<AppHeader title={t('goals.form.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('goals.form.loadErrorTitle')} description={t('goals.form.loadErrorDescription')} actionLabel={t('common.actions.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={
        <AppHeader
          title={isEditing ? t('goals.form.editTitle') : t('goals.form.createTitle')}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <View style={{ gap: theme.spacing.md }}>
        <ReadingFormField label={t('goals.form.name')} value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
        <ReadingFormField label={t('goals.form.description')} value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <ReadingFormField label={t('goals.form.startDate')} value={form.startDate} onChangeText={(startDate) => setForm((current) => ({ ...current, startDate }))} placeholder={t('goals.form.datePlaceholder')} />
          </View>
          <View style={{ flex: 1 }}>
            <ReadingFormField label={t('goals.form.targetDate')} value={form.targetDate} onChangeText={(targetDate) => setForm((current) => ({ ...current, targetDate }))} placeholder={t('goals.form.datePlaceholder')} />
          </View>
        </View>
      </View>

      {!isEditing ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title={t('goals.form.books')} description={t('goals.form.selectedCount', { count: selectedBookIds.length })} />
          {booksStatus === 'loading' ? <AppText color="textSecondary">{t('goals.form.loadingBooks')}</AppText> : null}
          {booksStatus === 'error' ? (
            <ErrorState title={t('goals.form.loadBooksErrorTitle')} description={t('goals.form.loadBooksErrorDescription')} />
          ) : null}
          {booksStatus === 'success' ? (
            <>
              <LibrarySearchInput value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => {
                  const selected = selectedBookIds.includes(book.id);
                  return (
                    <Card
                      key={book.id}
                      variant="interactive"
                      accessibilityLabel={selected ? t('goals.form.removeBookSelection', { title: book.title }) : t('goals.form.selectBook', { title: book.title })}
                      onPress={() => setSelectedBookIds((current) =>
                        current.includes(book.id)
                          ? current.filter((id) => id !== book.id)
                          : [...current, book.id],
                      )}>
                      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                        <BookCover url={book.coverUrl} title={book.title} size="sm" />
                        <View style={{ flex: 1, gap: theme.spacing.xs }}>
                          <AppText variant="heading3">{book.title}</AppText>
                          <AppText color="textSecondary">{book.authors}</AppText>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                            <Badge label={book.statusLabel} />
                            {selected ? <Badge label={t('goals.form.selected')} variant="active" /> : null}
                          </View>
                        </View>
                      </View>
                    </Card>
                  );
                })
              ) : (
                <Card variant="outlined">
                  <EmptyState icon="search-outline" title={t('goals.form.noBooksFound')} description={t('goals.form.noBooksFoundDescription')} />
                </Card>
              )}
            </>
          ) : null}
        </View>
      ) : null}

      {error ? <AppText color={error === t('goals.form.recommendedMessage') ? 'textSecondary' : 'error'}>{error}</AppText> : null}
      <Button title={isEditing ? t('goals.form.saveAction') : t('goals.form.createAction')} loading={submitting} onPress={submit} fullWidth />
    </Screen>
  );
}

function mapGoalFormMessage(message: string | null, t: (key: string) => string) {
  switch (message) {
    case 'Name is required.':
      return t('goals.form.validation.nameRequired');
    case 'Start date is required.':
      return t('goals.form.validation.startDateRequired');
    case 'Target date is required.':
      return t('goals.form.validation.targetDateRequired');
    case 'Use a valid start date in YYYY-MM-DD format.':
      return t('goals.form.validation.startDateInvalid');
    case 'Use a valid target date in YYYY-MM-DD format.':
      return t('goals.form.validation.targetDateInvalid');
    case 'Target date cannot be before start date.':
      return t('goals.form.validation.targetBeforeStart');
    case 'A book can be selected only once.':
      return t('goals.form.validation.duplicateBook');
    default:
      return message ?? t('errors.generic');
  }
}
