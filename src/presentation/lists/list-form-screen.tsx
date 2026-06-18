import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { ErrorState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button } from '@/src/components/ui';
import { useApplication } from '@/src/presentation';
import { bookListRoute } from '@/src/presentation/navigation/routes';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { validateBookListForm, type BookListFormState } from './lists-validation';

export function BookListFormScreen({ bookListId }: { bookListId?: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.form.loading')} />;
  return <BookListFormContent api={api} bookListId={bookListId} />;
}

function BookListFormContent({ api, bookListId }: { api: ApplicationApi; bookListId?: string }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<BookListFormState>({ name: '', description: '' });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(bookListId ? 'loading' : 'success');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isEditing = Boolean(bookListId);

  useEffect(() => {
    if (!bookListId) return;
    Promise.resolve(api.lists.getListDetails(bookListId))
      .then((details) => {
        setForm({ name: details.list.name, description: details.list.description ?? '' });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [api, bookListId]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;
    const validation = validateBookListForm(form);
    if (!validation.valid || !validation.input) {
      setError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const action = isEditing && bookListId
      ? api.lists.updateList({ id: bookListId, ...validation.input })
      : api.lists.createList(validation.input);

    Promise.resolve(action)
      .then((list) => router.replace(bookListRoute(list.id)))
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : t('lists.form.saveError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, bookListId, form, isEditing, t]);

  if (status === 'loading') return <Screen loading loadingMessage={t('lists.form.loading')} />;
  if (status === 'error') {
    return (
      <Screen header={<AppHeader title={t('lists.form.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('lists.form.loadErrorTitle')} description={t('lists.form.loadErrorDescription')} actionLabel={t('common.actions.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={<AppHeader title={isEditing ? t('lists.form.editTitle') : t('lists.form.createTitle')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
      <ReadingFormField label={t('lists.form.fieldName')} value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
      <ReadingFormField label={t('lists.form.fieldDescription')} value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
      {error ? <AppText color="error">{error}</AppText> : null}
      <Button title={isEditing ? t('lists.form.saveAction') : t('lists.form.createAction')} loading={submitting} onPress={submit} fullWidth />
    </Screen>
  );
}
