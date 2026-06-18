import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

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
  if (!api) return <Screen loading loadingMessage="Loading books" />;
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
      setError(validation.message);
      return;
    }
    if (validation.input.bookIds.length === 0) {
      setError('Select at least one book.');
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
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : 'Unable to add books.'))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, readingGoalId, selectedBookIds]);

  if (status === 'loading') return <Screen loading loadingMessage="Loading books" />;
  if (status === 'error') {
    return (
      <Screen header={<AppHeader title="Add books" leftAction={<Button title="Back" variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title="Unable to load books." description="Please try again." actionLabel="Try again" onAction={load} />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          title="Add books"
          subtitle="Choose local library books for this goal."
          leftAction={<Button title="Back" variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <LibrarySearchInput value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title="Books" description={`${selectedBookIds.length} selected`} />
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => {
            const selected = selectedBookIds.includes(book.id);
            return (
              <Card
                key={book.id}
                variant="interactive"
                accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${book.title}`}
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
                      {selected ? <Badge label="Selected" variant="active" /> : null}
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card variant="outlined">
            <EmptyState icon="search-outline" title="No books available" description="All matching books are already in this goal." />
          </Card>
        )}
      </View>
      {error ? <AppText color="error">{error}</AppText> : null}
      <Button title="Add books" loading={submitting} onPress={submit} fullWidth />
    </Screen>
  );
}
