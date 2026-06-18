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
import { BookCover, LibrarySearchInput } from '@/src/presentation/library/components';
import { bookListRoute, wishlistItemRoute } from '@/src/presentation/navigation/routes';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { mapLibraryBooksForLists } from './lists-mappers';
import type { AddListItemViewModel } from './lists-types';
import {
  validateAddListItemForm,
  validateWishlistItemForm,
  type AddListItemFormState,
  type WishlistItemFormState,
} from './lists-validation';

export function AddListItemScreen({
  bookListId,
  wishlist = false,
}: {
  bookListId?: string;
  wishlist?: boolean;
}) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.addItem.loading')} />;
  return <AddListItemContent api={api} bookListId={bookListId} wishlist={wishlist} />;
}

function AddListItemContent({ api, bookListId, wishlist }: { api: ApplicationApi; bookListId?: string; wishlist: boolean }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [viewModel, setViewModel] = useState<AddListItemViewModel>({ books: [], editions: [] });
  const [form, setForm] = useState<WishlistItemFormState>({
    workId: null,
    editionId: null,
    notes: '',
    wishlistPriority: 'medium',
    desiredFormat: 'any',
    targetPrice: '',
    targetCurrency: '',
  });
  const [query, setQuery] = useState('');
  const [ownership, setOwnership] = useState<'all' | 'owned' | 'not_owned'>('all');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const loadBooks = useCallback(() => {
    setStatus('loading');
    Promise.resolve(api.library.listBooks({ limit: 500, orderBy: 'title', orderDirection: 'asc' }))
      .then((page) => {
        setViewModel({ books: mapLibraryBooksForLists(page.items), editions: [] });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [api]);

  useEffect(() => loadBooks(), [loadBooks]);

  useEffect(() => {
    if (!form.workId) {
      setViewModel((current) => ({ ...current, editions: [] }));
      return;
    }

    Promise.resolve(api.library.getBookDetails(form.workId))
      .then((details) => {
        setViewModel((current) => ({
          ...current,
          editions: details.editions.map((edition) => ({
            id: edition.id,
            title: edition.title,
            meta: [edition.publisher, edition.publishedDate, edition.pageCount ? t('library.formatters.page', { count: edition.pageCount }) : null]
              .filter((value): value is string => Boolean(value))
              .join(' - ') || t('lists.addItem.editionDetailsUnavailable'),
          })),
        }));
      })
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : t('lists.addItem.loadEditionsError')));
  }, [api, form.workId, t]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return viewModel.books.filter((book) => {
      if (wishlist && book.copyCount > 0) return false;
      if (ownership === 'owned' && book.copyCount === 0) return false;
      if (ownership === 'not_owned' && book.copyCount > 0) return false;
      if (!normalizedQuery) return true;
      return [book.title, book.authors, book.statusLabel].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [ownership, query, viewModel.books, wishlist]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;
    const validation = wishlist
      ? validateWishlistItemForm(form)
      : validateAddListItemForm(form satisfies AddListItemFormState);
    if (!validation.valid || !validation.input) {
      setError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const action = wishlist
      ? api.lists.addWishlistItem(validation.input)
      : api.lists.addItem({ bookListId: bookListId ?? '', ...validation.input });

    Promise.resolve(action)
      .then((item) => {
        if (wishlist) router.replace(wishlistItemRoute(item.id));
        else router.replace(bookListRoute(bookListId ?? ''));
      })
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : t('lists.addItem.addBookError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, bookListId, form, t, wishlist]);

  if (status === 'loading') return <Screen loading loadingMessage={t('lists.addItem.loading')} />;
  if (status === 'error') {
    return (
      <Screen header={<AppHeader title={wishlist ? t('lists.addItem.addToWishlistTitle') : t('lists.addItem.addBooksTitle')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('lists.addItem.loadBooksErrorTitle')} description={t('lists.addItem.loadBooksErrorDescription')} actionLabel={t('common.actions.retry')} onAction={loadBooks} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={<AppHeader title={wishlist ? t('lists.addItem.addToWishlistTitle') : t('lists.addItem.addBooksTitle')} subtitle={t('lists.addItem.subtitle')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
      <LibrarySearchInput value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      {!wishlist ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['all', 'owned', 'not_owned'] as const).map((filter) => (
              <Button key={filter} title={filter === 'all' ? t('lists.addItem.all') : filter === 'owned' ? t('library.filters.owned') : t('lists.addItem.noCopy')} variant={ownership === filter ? 'secondary' : 'outline'} onPress={() => setOwnership(filter)} />
            ))}
          </View>
        </ScrollView>
      ) : null}
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('lists.addItem.booksTitle')} description={t('lists.addItem.availableCount', { count: filteredBooks.length })} />
        {filteredBooks.length > 0 ? filteredBooks.map((book) => (
          <Card
            key={book.id}
            variant="interactive"
            onPress={() => setForm((current) => ({ ...current, workId: book.id, editionId: null }))}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <BookCover url={book.coverUrl} title={book.title} size="sm" />
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <AppText variant="heading3">{book.title}</AppText>
                <AppText color="textSecondary">{book.authors}</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  <Badge label={book.statusLabel} variant={form.workId === book.id ? 'active' : 'default'} />
                  <Badge label={t('lists.addItem.copyCount', { count: book.copyCount })} />
                </View>
              </View>
            </View>
          </Card>
        )) : (
          <Card variant="outlined">
            <EmptyState icon="search-outline" title={t('lists.addItem.noBooksTitle')} description={wishlist ? t('lists.addItem.noBooksWishlistDescription') : t('lists.addItem.noBooksDescription')} />
          </Card>
        )}
      </View>

      {form.workId ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title={t('lists.addItem.editionTitle')} description={wishlist ? t('lists.addItem.editionOptionalUntilPurchase') : t('lists.addItem.editionOptional')} />
          <Card variant="interactive" onPress={() => setForm((current) => ({ ...current, editionId: null }))}>
            <AppText>{t('lists.addItem.anyEdition')}</AppText>
            {!form.editionId ? <Badge label={t('lists.addItem.selected')} variant="active" /> : null}
          </Card>
          {viewModel.editions.map((edition) => (
            <Card key={edition.id} variant="interactive" onPress={() => setForm((current) => ({ ...current, editionId: edition.id }))}>
              <AppText variant="heading3">{edition.title}</AppText>
              <AppText color="textSecondary">{edition.meta}</AppText>
              {form.editionId === edition.id ? <Badge label={t('lists.addItem.selected')} variant="active" /> : null}
            </Card>
          ))}
          {wishlist ? <WishlistFields form={form} setForm={setForm} /> : null}
          <ReadingFormField label={t('lists.addItem.notes')} value={form.notes} onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} multiline />
          {error ? <AppText color="error">{error}</AppText> : null}
          <Button title={wishlist ? t('lists.addItem.addToWishlistAction') : t('lists.addItem.addToListAction')} loading={submitting} onPress={submit} fullWidth />
        </View>
      ) : null}
    </Screen>
  );
}

function WishlistFields({
  form,
  setForm,
}: {
  form: WishlistItemFormState;
  setForm: React.Dispatch<React.SetStateAction<WishlistItemFormState>>;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('lists.addItem.wishlistDetailsTitle')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {(['low', 'medium', 'high'] as const).map((priority) => (
          <Button key={priority} title={priority} variant={form.wishlistPriority === priority ? 'secondary' : 'outline'} accessibilityLabel={t('lists.addItem.priorityAccessibility', { priority })} onPress={() => setForm((current) => ({ ...current, wishlistPriority: priority }))} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {(['any', 'physical', 'digital'] as const).map((desiredFormat) => (
          <Button key={desiredFormat} title={desiredFormat === 'any' ? t('lists.formatters.anyFormat') : desiredFormat === 'physical' ? t('lists.formatters.physical') : t('lists.formatters.digital')} variant={form.desiredFormat === desiredFormat ? 'secondary' : 'outline'} accessibilityLabel={t('lists.addItem.desiredFormatAccessibility', { format: desiredFormat })} onPress={() => setForm((current) => ({ ...current, desiredFormat }))} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <ReadingFormField label={t('lists.addItem.targetPrice')} value={form.targetPrice} onChangeText={(targetPrice) => setForm((current) => ({ ...current, targetPrice }))} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <ReadingFormField label={t('lists.addItem.currency')} value={form.targetCurrency} onChangeText={(targetCurrency) => setForm((current) => ({ ...current, targetCurrency: targetCurrency.toUpperCase() }))} placeholder="USD" />
        </View>
      </View>
    </View>
  );
}
