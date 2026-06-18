import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import {
  BookCover,
  LibrarySearchInput,
} from '@/src/presentation/library/components';
import { readingCycleRoute } from '@/src/presentation/navigation/routes';

import { ReadingFormField } from '../components';
import {
  mapStartReadingBook,
  mapStartReadingDetails,
} from '../reading-mappers';
import type {
  StartReadingBookOption,
  StartReadingDetailsViewModel,
} from '../reading-types';
import {
  createInitialStartReadingForm,
  validateStartReadingForm,
  type StartReadingFormState,
} from './start-reading-validation';
import { mapReadingErrorMessage } from '../reading-error-messages';

export function StartReadingScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('reading.start.loading')} />;
  }

  return <StartReadingContent api={api} />;
}

function StartReadingContent({ api }: { api: ApplicationApi }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [books, setBooks] = useState<StartReadingBookOption[]>([]);
  const [details, setDetails] = useState<StartReadingDetailsViewModel | null>(null);
  const [form, setForm] = useState<StartReadingFormState>(() => createInitialStartReadingForm());
  const [query, setQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'not_owned'>('all');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [detailsError, setDetailsError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const loadBooks = useCallback(() => {
    setStatus('loading');
    Promise.resolve(api.library.listBooks({ limit: 500, orderBy: 'title', orderDirection: 'asc' }))
      .then((page) => {
        setBooks(page.items.map(mapStartReadingBook));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        setFormError(mapReadingErrorMessage(nextError, 'loadLibrary'));
        setStatus('error');
      });
  }, [api]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!form.libraryBookId) {
      setDetails(null);
      return;
    }

    setDetailsError(null);
    Promise.resolve(api.library.getBookDetails(form.libraryBookId))
      .then((nextDetails) => {
        const viewModel = mapStartReadingDetails(nextDetails);
        setDetails(viewModel);
        setForm((current) => ({
          ...current,
          editionId: current.editionId ?? viewModel.editions[0]?.id ?? null,
          bookCopyId: null,
        }));
      })
      .catch((nextError: unknown) => {
        setDetailsError(nextError);
      });
  }, [api, form.libraryBookId]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return books.filter((book) => {
      if (book.active) return false;
      if (ownershipFilter === 'owned' && !book.owned) return false;
      if (ownershipFilter === 'not_owned' && book.owned) return false;
      if (!normalizedQuery) return true;

      return [book.title, book.authors, book.statusLabel]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [books, ownershipFilter, query]);

  const editionCopies = useMemo(() => (
    details?.copies.filter((copy) => copy.editionId === form.editionId) ?? []
  ), [details, form.editionId]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;

    const validation = validateStartReadingForm(form);
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    Promise.resolve(api.reading.startCycle({
      libraryBookId: form.libraryBookId ?? '',
      editionId: form.editionId ?? '',
      bookCopyId: form.bookCopyId,
      startedAt: form.startedAt,
    }))
      .then((cycle) => {
        router.replace(readingCycleRoute(cycle.id));
      })
      .catch((nextError: unknown) => {
        setFormError(mapReadingErrorMessage(nextError, 'start'));
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, form]);

  if (status === 'loading') {
    return <Screen loading loadingMessage={t('reading.start.loading')} />;
  }

  if (status === 'error') {
    return (
      <Screen
        header={
          <AppHeader
            title={t('reading.start.title')}
            leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          />
        }>
        <ErrorState
          title={t('reading.start.loadErrorTitle')}
          description={t('reading.start.loadErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={loadBooks}
        />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={
        <AppHeader
          title={t('reading.start.title')}
          subtitle={t('reading.start.subtitle')}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.start.bookSection')} description={t('reading.start.available', { count: filteredBooks.length })} />
        <LibrarySearchInput value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['all', 'owned', 'not_owned'] as const).map((filter) => (
              <Button
                key={filter}
                title={
                  filter === 'all'
                    ? t('reading.start.filterAll')
                    : filter === 'owned'
                      ? t('reading.start.filterOwned')
                      : t('reading.start.filterNoCopy')
                }
                variant={ownershipFilter === filter ? 'secondary' : 'outline'}
                onPress={() => setOwnershipFilter(filter)}
              />
            ))}
          </View>
        </ScrollView>
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <Card
              key={book.id}
              variant="interactive"
              onPress={() => {
                setForm((current) => ({
                  ...current,
                  libraryBookId: book.id,
                  editionId: null,
                  bookCopyId: null,
                }));
              }}>
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <BookCover url={book.coverUrl} title={book.title} size="sm" />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText variant="heading3">{book.title}</AppText>
                  <AppText color="textSecondary">{book.authors}</AppText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                    <Badge label={book.statusLabel} variant={form.libraryBookId === book.id ? 'active' : 'default'} />
                    {book.reread ? <Badge label={t('reading.start.reread')} variant="completed" /> : null}
                    <Badge label={book.nextCycleNumberLabel} variant="default" />
                  </View>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card variant="outlined">
            <EmptyState
              icon="search-outline"
              title={t('reading.start.emptyTitle')}
              description={t('reading.start.emptyDescription')}
            />
          </Card>
        )}
      </View>

      {detailsError ? (
        <ErrorState
          title={t('reading.start.detailsErrorTitle')}
          description={t('reading.start.detailsErrorDescription')}
        />
      ) : null}

      {details ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title={t('reading.start.editionSection')} />
          {details.editions.map((edition) => (
            <Card
              key={edition.id}
              variant="interactive"
              onPress={() => setForm((current) => ({ ...current, editionId: edition.id, bookCopyId: null }))}>
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <BookCover url={edition.coverUrl} title={edition.title} size="sm" />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText variant="heading3">{edition.title}</AppText>
                  {edition.publisher ? <AppText color="textSecondary">{edition.publisher}</AppText> : null}
                  {edition.publishedDate ? <AppText color="textSecondary">{edition.publishedDate}</AppText> : null}
                  {edition.language ? <AppText color="textSecondary">{t('reading.start.language', { language: edition.language })}</AppText> : null}
                  {edition.pageCount ? <AppText color="textSecondary">{t('reading.start.pageCount', { count: edition.pageCount })}</AppText> : null}
                  {edition.isbn ? <AppText color="textSecondary">ISBN {edition.isbn}</AppText> : null}
                  {form.editionId === edition.id ? <Badge label={t('reading.start.selected')} variant="active" /> : null}
                </View>
              </View>
            </Card>
          ))}

          <SectionHeader title={t('reading.start.copySection')} />
          <Card
            variant="interactive"
            onPress={() => setForm((current) => ({ ...current, bookCopyId: null }))}>
            <AppText>{t('reading.start.noOwnedCopy')}</AppText>
            {!form.bookCopyId ? <Badge label={t('reading.start.selected')} variant="active" /> : null}
          </Card>
          {editionCopies.map((copy) => (
            <Card
              key={copy.id}
              variant="interactive"
              onPress={() => setForm((current) => ({ ...current, bookCopyId: copy.id }))}>
              <AppText>{copy.label}</AppText>
              <AppText color="textSecondary">{copy.formatLabel}</AppText>
              {form.bookCopyId === copy.id ? <Badge label={t('reading.start.selected')} variant="active" /> : null}
            </Card>
          ))}

          <SectionHeader title={t('reading.start.startDateSection')} />
          <ReadingFormField
            label={t('reading.start.startDateLabel')}
            value={form.startedAt}
            onChangeText={(startedAt) => setForm((current) => ({ ...current, startedAt }))}
            placeholder={t('reading.start.datePlaceholder')}
          />
          {formError ? <AppText color="error">{formError}</AppText> : null}
          <Button title={t('reading.screen.startReadingAction')} loading={submitting} onPress={submit} fullWidth />
        </View>
      ) : null}
    </Screen>
  );
}
