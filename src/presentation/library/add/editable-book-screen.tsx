import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi, BookMetadataSource, EditableBookCover, EditableBookDraft } from '@/src/application';
import { ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { libraryBookRoute } from '@/src/presentation/navigation/routes';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { BookCover, FilterChip } from '../components';
import { mapLibraryBookSummary } from '../library-mappers';
import type {
  AddBookConfirmationState,
  EditableDraftDuplicateViewModel,
  LibraryBookViewModel,
} from '../library-types';
import {
  defaultAddBookConfirmation,
  validateAddBookConfirmation,
} from './add-book-validation';

export function ManualBookEntryScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('library.draft.loading')} />;
  }

  return <EditableBookScreenContent api={api} mode="manual" />;
}

export function GoogleBookDetailsScreen({
  volumeId,
  source,
}: {
  volumeId: string;
  source: BookMetadataSource;
}) {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('library.draft.loading')} />;
  }

  return <EditableBookScreenContent api={api} mode="external" externalId={volumeId} source={source} />;
}

function EditableBookScreenContent({
  api,
  mode,
  externalId,
  source,
}: {
  api: ApplicationApi;
  mode: 'manual' | 'external';
  externalId?: string;
  source?: BookMetadataSource;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [draft, setDraft] = useState<EditableBookDraft | null>(null);
  const [originalCover, setOriginalCover] = useState<EditableBookCover | null>(null);
  const [existingWorks, setExistingWorks] = useState<LibraryBookViewModel[]>([]);
  const [duplicates, setDuplicates] = useState<EditableDraftDuplicateViewModel | null>(null);
  const [form, setForm] = useState<AddBookConfirmationState>(defaultAddBookConfirmation);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const currentCoverRef = useRef<EditableBookCover | null>(null);

  const load = useCallback(() => {
    setStatus('loading');

    const draftPromise = mode === 'manual'
      ? Promise.resolve(api.library.createManualBookDraft())
      : Promise.resolve(
          api.googleBooks.getMetadata({
            source: source === 'brasil_api' ? 'brasil_api' : 'google_books',
            externalId: externalId ?? '',
          }),
        ).then((metadata) => api.library.createDraftFromMetadata(metadata));

    Promise.all([
      draftPromise,
      Promise.resolve(api.library.listBooks({ limit: 200, orderBy: 'title', orderDirection: 'asc' })),
    ])
      .then(([nextDraft, libraryPage]) => {
        setDraft(nextDraft);
        setOriginalCover(nextDraft.cover.kind === 'remote' ? nextDraft.cover : null);
        setExistingWorks(libraryPage.items.map(mapLibraryBookSummary));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        setStatus('error');
      });
  }, [api, externalId, mode, source]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    currentCoverRef.current = draft?.cover ?? null;
  }, [draft]);

  useEffect(() => () => {
    void api.library.discardDraftLocalBookCover(currentCoverRef.current);
  }, [api.library]);

  useEffect(() => {
    if (!draft) return;

    try {
      api.library.validateBookDraft(draft);
      const result = api.library.findPotentialBookDuplicates(draft);
      setDuplicates({
        exactEditionLibraryBookId: result.exactEdition?.libraryBookId ?? null,
        exactEditionReason: result.exactEdition?.reason ?? null,
        suggestedLibraryBookIds: result.suggestedLibraryBookIds,
      });

      if (result.exactEdition?.libraryBookId) {
        setForm((current) => ({
          ...current,
          workMode: 'existing',
          existingLibraryBookId: result.exactEdition?.libraryBookId ?? current.existingLibraryBookId,
        }));
      }
    } catch {
      setDuplicates(null);
    }
  }, [api.library, draft]);

  const updateDraft = useCallback((updater: (current: EditableBookDraft) => EditableBookDraft) => {
    setDraft((current) => {
      if (!current) return current;
      return updater(current);
    });
  }, []);

  const selectCover = useCallback(async () => {
    if (!draft) return;

    const selected = await api.library.selectLocalBookCover();
    if (!selected) return;

    await api.library.discardDraftLocalBookCover(draft.cover);
    updateDraft((current) => ({
      ...current,
      cover: selected,
    }));
  }, [api.library, draft, updateDraft]);

  const removeCover = useCallback(async () => {
    if (!draft) return;
    await api.library.discardDraftLocalBookCover(draft.cover);
    updateDraft((current) => ({
      ...current,
      cover: api.library.removeBookCover(),
    }));
  }, [api.library, draft, updateDraft]);

  const restoreOriginalCover = useCallback(async () => {
    if (!draft || !originalCover) return;
    await api.library.discardDraftLocalBookCover(draft.cover);
    updateDraft((current) => ({
      ...current,
      cover: originalCover,
    }));
  }, [api.library, draft, originalCover, updateDraft]);

  const submit = useCallback(async () => {
    if (!draft || submittingRef.current) return;

    const copyValidation = validateAddBookConfirmation(form);
    if (!copyValidation.valid) {
      setError(mapDraftError(copyValidation.message, t));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.library.addEditableBookDraftToLibrary({
        draft,
        workMode: form.workMode,
        existingLibraryBookId: form.existingLibraryBookId.trim() || null,
        owned: form.owned,
        format: form.format,
        copyLabel: form.copyLabel.trim() || null,
        acquiredAt: form.acquiredAt.trim() || null,
        notes: form.notes.trim() || null,
      });

      router.replace(libraryBookRoute(result.libraryBook.id));
    } catch (nextError: unknown) {
      setError(mapDraftError(nextError instanceof Error ? nextError.message : null, t));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [api.library, draft, form, t]);

  if (status === 'loading') {
    return <Screen loading loadingMessage={t('library.draft.loading')} />;
  }

  if (status === 'error' || !draft) {
    return (
      <Screen
        header={
          <AppHeader
            title={mode === 'manual' ? t('library.draft.manualTitle') : t('library.search.detailsTitle')}
            leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          />
        }>
        <ErrorState
          title={t('library.draft.loadErrorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={load}
        />
      </Screen>
    );
  }

  const duplicateWorkIds = new Set(duplicates?.suggestedLibraryBookIds ?? []);

  return (
    <Screen
      keyboardAvoiding
      header={
        <AppHeader
          title={mode === 'manual' ? t('library.draft.manualTitle') : t('library.draft.externalTitle')}
          subtitle={mode === 'manual' ? t('library.draft.manualSubtitle') : t('library.draft.externalSubtitle')}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
        />
      }>
      <Card variant="outlined">
        <SectionHeader title={t('library.draft.coverTitle')} description={t('library.draft.coverDescription')} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
          <BookCover url={draft.cover.kind === 'none' ? null : draft.cover.uri} title={draft.title || t('common.appName')} size="lg" />
          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            <Button title={t('library.draft.chooseCover')} variant="outline" onPress={selectCover} />
            <Button title={t('library.draft.removeCover')} variant="ghost" disabled={draft.cover.kind === 'none'} onPress={removeCover} />
            <Button title={t('library.draft.restoreCover')} variant="ghost" disabled={!originalCover || draft.cover.kind === 'remote'} onPress={restoreOriginalCover} />
          </View>
        </View>
      </Card>

      <Card variant="outlined">
        <SectionHeader title={t('library.draft.infoTitle')} description={t('library.draft.infoDescription')} />
        <View style={{ gap: theme.spacing.md }}>
          <ReadingFormField label={t('library.draft.titleField')} value={draft.title} onChangeText={(title) => updateDraft((current) => ({ ...current, title }))} />
          <ReadingFormField label={t('library.draft.subtitleField')} value={draft.subtitle ?? ''} onChangeText={(subtitle) => updateDraft((current) => ({ ...current, subtitle }))} />
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={t('library.draft.authorsTitle')} action={<Button title={t('library.draft.addAuthor')} variant="ghost" onPress={() => updateDraft((current) => ({ ...current, authors: [...current.authors, ''] }))} />} />
            {draft.authors.map((author, index) => (
              <View key={`${index}-${author}`} style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <ReadingFormField
                    label={t('library.draft.authorField', { count: index + 1 })}
                    value={author}
                    onChangeText={(value) => updateDraft((current) => ({
                      ...current,
                      authors: current.authors.map((item, itemIndex) => (itemIndex === index ? value : item)),
                    }))}
                  />
                </View>
                <Button
                  title={t('common.actions.delete')}
                  variant="ghost"
                  disabled={draft.authors.length === 1}
                  onPress={() => updateDraft((current) => ({
                    ...current,
                    authors: current.authors.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                />
              </View>
            ))}
          </View>
          <ReadingFormField label={t('library.draft.publisherField')} value={draft.publisher ?? ''} onChangeText={(publisher) => updateDraft((current) => ({ ...current, publisher }))} />
          <ReadingFormField label={t('library.draft.publishedDateField')} value={draft.publishedDate ?? ''} onChangeText={(publishedDate) => updateDraft((current) => ({ ...current, publishedDate }))} placeholder={t('library.draft.publishedDatePlaceholder')} />
          <ReadingFormField label={t('library.draft.pageCountField')} value={draft.pageCount == null ? '' : String(draft.pageCount)} onChangeText={(pageCount) => updateDraft((current) => ({ ...current, pageCount: pageCount.trim().length === 0 ? null : Number(pageCount) }))} keyboardType="number-pad" />
          <ReadingFormField label={t('library.draft.isbn10Field')} value={draft.isbn10 ?? ''} onChangeText={(isbn10) => updateDraft((current) => ({ ...current, isbn10 }))} />
          <ReadingFormField label={t('library.draft.isbn13Field')} value={draft.isbn13 ?? ''} onChangeText={(isbn13) => updateDraft((current) => ({ ...current, isbn13 }))} />
          <ReadingFormField label={t('library.draft.languageField')} value={draft.language ?? ''} onChangeText={(language) => updateDraft((current) => ({ ...current, language }))} />
          <ReadingFormField label={t('library.draft.descriptionField')} value={draft.description ?? ''} onChangeText={(description) => updateDraft((current) => ({ ...current, description }))} multiline />
        </View>
      </Card>

      <Card variant="outlined">
        <SectionHeader title={t('library.confirmation.workDecision')} description={t('library.draft.workDecisionDescription')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <FilterChip label={t('library.confirmation.createNewWork')} selected={form.workMode === 'create'} onPress={() => setForm((current) => ({ ...current, workMode: 'create' }))} />
          <FilterChip label={t('library.confirmation.linkExistingWork')} selected={form.workMode === 'existing'} onPress={() => setForm((current) => ({ ...current, workMode: 'existing' }))} />
        </View>
        {duplicates?.exactEditionReason ? (
          <AppText color="textSecondary">{t(`library.draft.duplicate.${duplicates.exactEditionReason}`)}</AppText>
        ) : null}
        {(form.workMode === 'existing' || duplicateWorkIds.size > 0) ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {existingWorks.map((book) => (
              <FilterChip
                key={book.id}
                label={book.title}
                selected={form.existingLibraryBookId === book.id}
                onPress={() => setForm((current) => ({ ...current, existingLibraryBookId: book.id, workMode: 'existing' }))}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card variant="outlined">
        <SectionHeader title={t('library.draft.copyTitle')} description={t('library.draft.copyDescription')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <FilterChip label={t('library.confirmation.owned')} selected={form.owned} onPress={() => setForm((current) => ({ ...current, owned: true }))} />
          <FilterChip label={t('library.confirmation.notOwned')} selected={!form.owned} onPress={() => setForm((current) => ({ ...current, owned: false }))} />
        </View>
        <AppText color="textSecondary">{t('library.confirmation.initialStatus')}</AppText>
        {form.owned ? (
          <View style={{ gap: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <FilterChip label={t('library.formatters.physical')} selected={form.format === 'physical'} onPress={() => setForm((current) => ({ ...current, format: 'physical' }))} />
              <FilterChip label={t('library.formatters.digital')} selected={form.format === 'digital'} onPress={() => setForm((current) => ({ ...current, format: 'digital' }))} />
            </View>
            <ReadingFormField label={t('library.confirmation.copyLabel')} value={form.copyLabel} onChangeText={(copyLabel) => setForm((current) => ({ ...current, copyLabel }))} />
            <ReadingFormField label={t('library.confirmation.acquiredDate')} value={form.acquiredAt} onChangeText={(acquiredAt) => setForm((current) => ({ ...current, acquiredAt }))} placeholder={t('library.draft.publishedDatePlaceholder')} />
            <ReadingFormField label={t('library.confirmation.copyNotes')} value={form.notes} onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} multiline />
          </View>
        ) : null}
      </Card>

      {duplicates?.exactEditionLibraryBookId ? (
        <Card variant="outlined">
          <Badge label={t('library.draft.alreadyInLibrary')} variant="active" />
          <AppText color="textSecondary">{t('library.draft.alreadyInLibraryDescription')}</AppText>
        </Card>
      ) : null}

      {error ? <AppText color="error">{error}</AppText> : null}

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button title={t('common.actions.cancel')} variant="ghost" onPress={() => router.back()} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button title={t('library.confirmation.submit')} loading={submitting} onPress={submit} fullWidth />
        </View>
      </View>
    </Screen>
  );
}

function mapDraftError(
  message: string | null,
  t: (key: string) => string,
): string {
  if (!message) return t('library.draft.saveError');
  if (message.includes('Book title is required')) return t('library.draft.validation.titleRequired');
  if (message.includes('At least one author is required')) return t('library.draft.validation.authorRequired');
  if (message.includes('Page count')) return t('library.draft.validation.pageCount');
  if (message.includes('ISBN-10 is invalid')) return t('library.draft.validation.isbn10');
  if (message.includes('ISBN-13 is invalid')) return t('library.draft.validation.isbn13');
  if (message.includes('do not match')) return t('library.draft.validation.isbnMismatch');
  if (message.includes('Published date')) return t('library.draft.validation.publishedDate');
  if (message.includes('Choose an existing work')) return t('library.draft.validation.existingWork');
  if (message.includes('Cover image')) return t('library.draft.validation.cover');
  if (message.includes('Only JPEG, PNG, and WebP')) return t('library.draft.validation.cover');
  if (message.includes('already in your library')) return t('library.draft.validation.duplicate');
  return t('library.draft.saveError');
}
