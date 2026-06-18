import { router } from 'expo-router';
import { View } from 'react-native';

import { ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppText, Badge, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';

import { BookCover } from '../components';
import { formatPageCount } from '../library-formatters';
import { BookCopyList } from './book-copy-list';
import { useLibraryBookDetails } from './library-book-details-controller';
import { LibraryBookHeader } from './library-book-header';
import { ReadingHistorySummary } from './reading-history-summary';

export function LibraryBookDetailsScreen({ libraryBookId }: { libraryBookId: string }) {
  const { api } = useApplication();

  if (!api) {
    return <Screen loading loadingMessage="Loading book details" />;
  }

  return <LibraryBookDetailsContent api={api} libraryBookId={libraryBookId} />;
}

function LibraryBookDetailsContent({
  api,
  libraryBookId,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
  libraryBookId: string;
}) {
  const { theme } = useAppTheme();
  const state = useLibraryBookDetails(api, libraryBookId);

  if (state.status === 'loading' || state.status === 'idle') {
    return <Screen loading loadingMessage="Loading book details" />;
  }

  if (state.status === 'error' || !state.details) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load this book."
          description="Please try again."
          actionLabel="Try again"
          onAction={state.retry}
        />
      </Screen>
    );
  }

  const details = state.details;

  return (
    <Screen>
      <LibraryBookHeader details={details} onBack={() => router.back()} />
      {details.description ? (
        <Card variant="outlined">
          <AppText variant="heading3">Description</AppText>
          <AppText color="textSecondary">{details.description}</AppText>
        </Card>
      ) : null}
      {details.notes || details.rating != null ? (
        <Card variant="outlined">
          {details.rating != null ? <AppText>Rating {details.rating}/5</AppText> : null}
          {details.notes ? <AppText color="textSecondary">{details.notes}</AppText> : null}
        </Card>
      ) : null}
      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title="Editions" />
        {details.editions.map((edition) => (
          <Card key={edition.id} variant="outlined">
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <BookCover url={edition.coverUrl} title={edition.title} size="sm" />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="heading3">{edition.title}</AppText>
                {edition.publisher ? <AppText color="textSecondary">{edition.publisher}</AppText> : null}
                {edition.publishedDate ? <AppText color="textSecondary">{edition.publishedDate}</AppText> : null}
                {edition.language ? <AppText color="textSecondary">Language {edition.language}</AppText> : null}
                {formatPageCount(edition.pageCount) ? (
                  <AppText color="textSecondary">{formatPageCount(edition.pageCount)}</AppText>
                ) : null}
                {edition.isbn10 ? <AppText color="textSecondary">ISBN-10 {edition.isbn10}</AppText> : null}
                {edition.isbn13 ? <AppText color="textSecondary">ISBN-13 {edition.isbn13}</AppText> : null}
                {edition.hasCopy ? <Badge label="Has copy" variant="active" /> : null}
              </View>
            </View>
          </Card>
        ))}
      </View>
      <BookCopyList
        details={details}
        form={state.addCopyForm}
        error={state.addCopyError}
        submitting={state.submittingCopy}
        onFormChange={state.setAddCopyForm}
        onSubmit={state.submitCopy}
        onRemove={state.removeCopy}
      />
      <ReadingHistorySummary details={details} />
      <Card variant="outlined">
        <SectionHeader title="Lists and goals" />
        <AppText color="textSecondary">
          Lists: {details.lists.length > 0 ? details.lists.join(', ') : 'None'}
        </AppText>
        <AppText color="textSecondary">
          Goals: {details.goals.length > 0 ? details.goals.join(', ') : 'None'}
        </AppText>
      </Card>
    </Screen>
  );
}
