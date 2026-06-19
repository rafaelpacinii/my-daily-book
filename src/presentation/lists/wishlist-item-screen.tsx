import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';
import { libraryBookRoute } from '@/src/presentation/navigation/routes';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { mapBookListItem } from './lists-mappers';
import type { BookListItemViewModel, PurchaseLinkViewModel } from './lists-types';
import {
  validateMarkAsPurchasedForm,
  validatePurchaseLinkForm,
  validateWishlistItemForm,
  type MarkAsPurchasedFormState,
  type PurchaseLinkFormState,
  type WishlistItemFormState,
} from './lists-validation';

export function WishlistItemScreen({ bookListItemId }: { bookListItemId: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.wishlistItem.loading')} />;
  return <WishlistItemContent api={api} bookListItemId={bookListItemId} />;
}

function WishlistItemContent({ api, bookListItemId }: { api: ApplicationApi; bookListItemId: string }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [item, setItem] = useState<BookListItemViewModel | null>(null);
  const [editions, setEditions] = useState<{ id: string; title: string }[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [wishlistForm, setWishlistForm] = useState<WishlistItemFormState>({
    workId: null,
    editionId: null,
    notes: '',
    wishlistPriority: 'medium',
    desiredFormat: 'any',
    targetPrice: '',
    targetCurrency: '',
  });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseLinkFormState>({
    storeName: '',
    url: '',
    price: '',
    currency: '',
    notes: '',
  });
  const [purchaseLinkId, setPurchaseLinkId] = useState<string | null>(null);
  const [purchaseFormVisible, setPurchaseFormVisible] = useState(false);
  const [markForm, setMarkForm] = useState<MarkAsPurchasedFormState>({
    editionId: null,
    format: 'physical',
    label: '',
    notes: '',
    acquiredAt: '',
  });

  const load = useCallback(() => {
    setStatus('loading');
    setError(null);
    Promise.resolve(api.lists.getItemDetails(bookListItemId))
      .then((details) => {
        const mapped = mapBookListItem(details);
        setItem(mapped);
        setWishlistForm({
          workId: mapped.workId,
          editionId: mapped.editionId,
          notes: mapped.notes ?? '',
          wishlistPriority: mapped.priority ?? 'medium',
          desiredFormat: mapped.desiredFormat ?? 'any',
          targetPrice: mapped.targetPrice == null ? '' : `${mapped.targetPrice}`,
          targetCurrency: mapped.targetCurrency ?? '',
        });
        setMarkForm((current) => ({ ...current, editionId: mapped.editionId }));
        return api.library.listBooks({ limit: 500 }).items.find((book) => book.work.id === mapped.workId);
      })
      .then((summary) => {
        if (!summary) return [];
        return api.library.getBookDetails(summary.libraryBook.id).editions.map((edition) => ({ id: edition.id, title: edition.title }));
      })
      .then((nextEditions) => {
        setEditions(nextEditions);
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : t('lists.wishlistItem.loadErrorTitle'));
        setStatus('error');
      });
  }, [api, bookListItemId, t]);

  useEffect(() => load(), [load]);

  const submitWishlist = useCallback(() => {
    if (!item || submittingRef.current) return;
    const validation = validateWishlistItemForm(wishlistForm);
    if (!validation.valid || !validation.input) {
      setError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    Promise.resolve(api.lists.updateWishlistItem({
      id: item.id,
      notes: validation.input.notes,
      wishlistPriority: validation.input.wishlistPriority,
      desiredFormat: validation.input.desiredFormat,
      targetPrice: validation.input.targetPrice,
      targetCurrency: validation.input.targetCurrency,
    }))
      .then(() => load())
      .catch(() => setError(t('lists.wishlistItem.updateError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, item, load, t, wishlistForm]);

  const submitPurchaseLink = useCallback(() => {
    if (!item || submittingRef.current) return;
    const validation = validatePurchaseLinkForm(purchaseForm);
    if (!validation.valid || !validation.input) {
      setError(validation.message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const action = purchaseLinkId
      ? api.lists.updatePurchaseLink({ id: purchaseLinkId, ...validation.input })
      : api.lists.addPurchaseLink({ bookListItemId: item.id, ...validation.input });

    Promise.resolve(action)
      .then(() => {
        setPurchaseForm({ storeName: '', url: '', price: '', currency: '', notes: '' });
        setPurchaseLinkId(null);
        setPurchaseFormVisible(false);
        load();
      })
      .catch(() => setError(t('lists.wishlistItem.saveLinkError')))
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [api, item, load, purchaseForm, purchaseLinkId, t]);

  const markPurchased = useCallback(() => {
    if (!item || submittingRef.current) return;
    const validation = validateMarkAsPurchasedForm(markForm);
    if (!validation.valid || !validation.input) {
      setError(validation.message);
      return;
    }

    const run = () => {
      submittingRef.current = true;
      setSubmitting(true);
      setError(null);
      Promise.resolve(api.lists.markWishlistItemAsPurchased({ id: item.id, ...validation.input }))
        .then((result) => router.replace(libraryBookRoute(result.libraryBook.id)))
        .catch(() => setError(t('lists.wishlistItem.markPurchasedError')))
        .finally(() => {
          submittingRef.current = false;
          setSubmitting(false);
        });
    };

    if (Platform.OS === 'web') run();
    else Alert.alert(t('lists.wishlistItem.markPurchasedTitle'), t('lists.wishlistItem.markPurchasedDescription'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('lists.wishlistItem.confirm'), onPress: run },
    ]);
  }, [api, item, markForm, t]);

  const removeFromWishlist = useCallback(() => {
    if (!item || submittingRef.current) return;
    const run = () => {
      submittingRef.current = true;
      setSubmitting(true);
      Promise.resolve(api.lists.removeItem(item.id))
        .then(() => router.replace('/wishlist'))
        .catch(() => setError(t('lists.wishlistItem.removeError')))
        .finally(() => {
          submittingRef.current = false;
          setSubmitting(false);
        });
    };
    if (Platform.OS === 'web') run();
    else Alert.alert(t('lists.wishlistItem.removeTitle'), t('lists.wishlistItem.removeDescription'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.remove'), style: 'destructive', onPress: run },
    ]);
  }, [api, item, t]);

  if (status === 'loading') return <Screen loading loadingMessage={t('lists.wishlistItem.loading')} />;
  if (status === 'error' || !item) {
    return (
      <Screen header={<AppHeader title={t('lists.wishlistItem.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('lists.wishlistItem.loadErrorTitle')} description={error ?? t('lists.wishlistItem.loadErrorDescription')} actionLabel={t('common.actions.retry')} onAction={load} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      header={<AppHeader title={item.title} subtitle={t('lists.wishlistItem.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
      <Card variant="elevated">
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <BookCover url={item.coverUrl} title={item.title} />
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText variant="heading3">{item.title}</AppText>
            <AppText color="textSecondary">{item.authors}</AppText>
            <AppText color="textSecondary">{item.editionLabel}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              <Badge label={item.priorityLabel} />
              <Badge label={item.desiredFormatLabel} />
              <Badge label={item.targetPriceLabel} />
              <Badge label={item.ownedLabel} variant={item.owned ? 'read' : 'default'} />
            </View>
          </View>
        </View>
      </Card>

      <SectionHeader title={t('lists.wishlistItem.edit')} />
      <WishlistEditFields form={wishlistForm} setForm={setWishlistForm} />
      <ReadingFormField label={t('lists.wishlistItem.notes')} value={wishlistForm.notes} onChangeText={(notes) => setWishlistForm((current) => ({ ...current, notes }))} multiline />
      <Button title={t('lists.wishlistItem.saveItem')} loading={submitting} onPress={submitWishlist} fullWidth />

      <SectionHeader title={t('lists.wishlistItem.purchaseLinks')} />
      {item.purchaseLinks.map((link) => (
        <PurchaseLinkCard
          key={link.id}
          link={link}
          onOpen={() => openPurchaseLink(link.url, setError, t)}
          onEdit={() => {
            setPurchaseForm({
              storeName: link.storeName === t('lists.wishlistItem.purchaseLinkFallback') ? '' : link.storeName,
              url: link.url,
              price: link.price == null ? '' : `${link.price}`,
              currency: link.currency ?? '',
              notes: link.notes ?? '',
            });
            setPurchaseLinkId(link.id);
            setPurchaseFormVisible(true);
          }}
          onDelete={() => {
            setSubmitting(true);
            Promise.resolve(api.lists.removePurchaseLink(link.id))
              .then(() => load())
              .catch(() => setError(t('lists.wishlistItem.deleteLinkError')))
              .finally(() => setSubmitting(false));
          }}
        />
      ))}
      {purchaseFormVisible ? (
        <Card variant="outlined">
          <ReadingFormField label={t('lists.wishlistItem.storeName')} value={purchaseForm.storeName} onChangeText={(storeName) => setPurchaseForm((current) => ({ ...current, storeName }))} />
          <ReadingFormField label={t('lists.wishlistItem.url')} value={purchaseForm.url} onChangeText={(url) => setPurchaseForm((current) => ({ ...current, url }))} />
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <ReadingFormField label={t('lists.wishlistItem.price')} value={purchaseForm.price} onChangeText={(price) => setPurchaseForm((current) => ({ ...current, price }))} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <ReadingFormField label={t('lists.wishlistItem.currency')} value={purchaseForm.currency} onChangeText={(currency) => setPurchaseForm((current) => ({ ...current, currency: currency.toUpperCase() }))} placeholder="USD" />
            </View>
          </View>
          <ReadingFormField label={t('lists.wishlistItem.notes')} value={purchaseForm.notes} onChangeText={(notes) => setPurchaseForm((current) => ({ ...current, notes }))} multiline />
          <Button title={purchaseLinkId ? t('lists.wishlistItem.saveLink') : t('lists.wishlistItem.addLink')} loading={submitting} onPress={submitPurchaseLink} />
        </Card>
      ) : (
        <Button title={t('lists.wishlistItem.addPurchaseLink')} variant="secondary" onPress={() => setPurchaseFormVisible(true)} />
      )}

      <SectionHeader title={t('lists.wishlistItem.markPurchased')} />
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {editions.map((edition) => (
            <Button key={edition.id} title={edition.title} variant={markForm.editionId === edition.id ? 'secondary' : 'outline'} onPress={() => setMarkForm((current) => ({ ...current, editionId: edition.id }))} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {(['physical', 'digital'] as const).map((format) => (
            <Button key={format} title={format === 'physical' ? t('lists.formatters.physical') : t('lists.formatters.digital')} variant={markForm.format === format ? 'secondary' : 'outline'} onPress={() => setMarkForm((current) => ({ ...current, format }))} />
          ))}
        </View>
        <ReadingFormField label={t('lists.wishlistItem.copyLabel')} value={markForm.label} onChangeText={(label) => setMarkForm((current) => ({ ...current, label }))} />
        <ReadingFormField label={t('lists.wishlistItem.acquiredAt')} value={markForm.acquiredAt} onChangeText={(acquiredAt) => setMarkForm((current) => ({ ...current, acquiredAt }))} placeholder="YYYY-MM-DD" />
        <ReadingFormField label={t('lists.wishlistItem.copyNotes')} value={markForm.notes} onChangeText={(notes) => setMarkForm((current) => ({ ...current, notes }))} multiline />
        <Button title={t('lists.wishlistItem.markPurchased')} loading={submitting} onPress={markPurchased} />
      </Card>
      {error ? <AppText color="error">{error}</AppText> : null}
      <Button title={t('lists.wishlistItem.removeFromWishlist')} variant="danger" loading={submitting} onPress={removeFromWishlist} fullWidth />
    </Screen>
  );
}

function WishlistEditFields({
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {(['low', 'medium', 'high'] as const).map((wishlistPriority) => (
          <Button key={wishlistPriority} title={formatPriority(wishlistPriority, t)} variant={form.wishlistPriority === wishlistPriority ? 'secondary' : 'outline'} onPress={() => setForm((current) => ({ ...current, wishlistPriority }))} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {(['any', 'physical', 'digital'] as const).map((desiredFormat) => (
          <Button key={desiredFormat} title={formatDesiredFormat(desiredFormat, t)} variant={form.desiredFormat === desiredFormat ? 'secondary' : 'outline'} onPress={() => setForm((current) => ({ ...current, desiredFormat }))} />
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

function PurchaseLinkCard({
  link,
  onOpen,
  onEdit,
  onDelete,
}: {
  link: PurchaseLinkViewModel;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{link.storeName}</AppText>
      <AppText color="textSecondary">{link.url}</AppText>
      <AppText color="textSecondary">{link.priceLabel}</AppText>
      {link.notes ? <AppText color="textSecondary">{link.notes}</AppText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button title={t('lists.wishlistItem.openLink')} variant="secondary" accessibilityLabel={t('lists.wishlistItem.openExternalLink', { storeName: link.storeName })} onPress={onOpen} />
        <Button title={t('common.actions.edit')} variant="outline" onPress={onEdit} />
        <Button title={t('common.actions.delete')} variant="danger" onPress={onDelete} />
      </View>
    </Card>
  );
}

function openPurchaseLink(url: string, setError: (message: string | null) => void, t: (key: string) => string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      setError(t('lists.wishlistItem.onlyHttpLinks'));
      return;
    }
    Linking.openURL(url).catch(() => setError(t('lists.wishlistItem.openLinkError')));
  } catch {
    setError(t('lists.wishlistItem.invalidLinkError'));
  }
}

function formatPriority(priority: WishlistItemFormState['wishlistPriority'], t: (key: string) => string) {
  if (priority === 'high') return t('lists.formatters.highPriority');
  if (priority === 'low') return t('lists.formatters.lowPriority');
  return t('lists.formatters.mediumPriority');
}

function formatDesiredFormat(format: WishlistItemFormState['desiredFormat'], t: (key: string) => string) {
  if (format === 'physical') return t('lists.formatters.physical');
  if (format === 'digital') return t('lists.formatters.digital');
  return t('lists.formatters.anyFormat');
}
