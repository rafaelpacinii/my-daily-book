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

import { mapLibraryBooksForGoalSelection } from './goals-mappers';
import type { ReadingGoalBooksViewModel } from './goals-types';
import { validateReadingGoalBooksForm } from './goals-validation';

export function AddReadingGoalBooksScreen({ readingGoalId }: { readingGoalId: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('goals.addBooks.loading')} />;
  return <AddReadingGoalBooksContent api={api} readingGoalId={readingGoalId} />;
}

function AddReadingGoalBooksContent({
  api,
  readingGoalId,
}: {
  api: ApplicationApi;
  readingGoalId: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [viewModel, setViewModel] = useState<ReadingGoalBooksViewModel>({
    books: [],
    existingBookIds: [],
  });
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([
      Promise.resolve(api.goals.getGoalDetails(readingGoalId)),
      Promise.resolve(api.library.listBooks({ limit: 500, orderBy: 'title', orderDirection: 'asc' })),
    ])
      .then(([goal, books]) => {
        setViewModel({
          existingBookIds: goal.items.map(({ item }) => item.libraryBookId),
          books: mapLibraryBooksForGoalSelection(books.items),
        });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [api, readingGoalId]);

  useEffect(() => load(), [load]);

  const filteredBooks = useMemo(() => {
    const existing = new Set(viewModel.existingBookIds);
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return viewModel.books.filter((book) => {
      if (existing.has(book.id)) return false;
      if (!normalizedQuery) return true;
      return [book.title, book.authors, book.statusLabel].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [query, viewModel.books, viewModel.existingBookIds]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;
    const validation = validateReadingGoalBooksForm({ selectedBookIds });
    if (!validation.valid || !validation.input) {
      setError(validation.message === 'A book can be selected only once.' ? t('goals.form.validation.duplicateBook') : validation.message);
      return;
    }
    if (validation.input.bookIds.length === 0) {
      setError(t('goals.addBooks.selectAtLeastOne'));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    validation.input.bookIds
      .reduce(
        (chain, libraryBookId, position) =>
          chain.then(() => Promise.resolve(api.goals.addBook({ readingGoalId, libraryBookId, position }))),
        Promise.resolve<unknown>(null),
      )
      .then(() => router.replace(readingGoalRoute(readingGoalId)))
      .catch(() => setError(t('goals.addBooks.addError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, readingGoalId, selectedBookIds, t]);

  if (status === 'loading') return <Screen loading loadingMessage={t('goals.addBooks.loading')} />;
  if (status === 'error') {
    return (
      <Screen header={<AppHeader title={t('goals.addBooks.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('goals.addBooks.loadErrorTitle')} description={t('goals.addBooks.loadErrorDescription')} actionLabel={t('common.actions.retry')} onAction={load} />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title={t('goals.addBooks.title')}
          subtitle={t('goals.addBooks.subtitle')}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <LibrarySearchInput value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('goals.addBooks.books')} description={t('goals.addBooks.selectedCount', { count: selectedBookIds.length })} />
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => {
            const selected = selectedBookIds.includes(book.id);
            return (
              <Card
                key={book.id}
                variant="interactive"
                accessibilityLabel={selected ? t('goals.addBooks.removeBookSelection', { title: book.title }) : t('goals.addBooks.selectBook', { title: book.title })}
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
                      {selected ? <Badge label={t('goals.addBooks.selected')} variant="active" /> : null}
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card variant="outlined">
            <EmptyState icon="search-outline" title={t('goals.addBooks.emptyTitle')} description={t('goals.addBooks.emptyDescription')} />
          </Card>
        )}
      </View>
      {error ? <AppText color="error">{error}</AppText> : null}
      <Button title={t('goals.addBooks.submit')} loading={submitting} onPress={submit} fullWidth />
    </Screen>
  );
}
