import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/src/components/layout';
import { AppText, Button, Card, Divider } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import type {
  AddCopyFormState,
  LibraryBookDetailsViewModel,
  LibraryCopyViewModel,
} from '../library-types';
import { FilterChip } from '../components';

export interface BookCopyListProps {
  details: LibraryBookDetailsViewModel;
  form: AddCopyFormState;
  error: string | null;
  submitting: boolean;
  onFormChange: (form: AddCopyFormState) => void;
  onSubmit: () => void;
  onRemove: (copyId: string) => void;
}

export function BookCopyList({
  details,
  form,
  error,
  submitting,
  onFormChange,
  onSubmit,
  onRemove,
}: BookCopyListProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('library.details.copies')} description={t('library.details.copiesSaved', { count: details.copies.length })} />
      {details.copies.length === 0 ? (
        <Card variant="outlined">
          <AppText color="textSecondary">{t('library.details.noCopiesSaved')}</AppText>
        </Card>
      ) : (
        details.copies.map((copy) => (
          <CopyCard key={copy.id} copy={copy} onRemove={() => onRemove(copy.id)} />
        ))
      )}
      <Card variant="outlined">
        <AppText variant="heading3">{t('library.details.addCopy')}</AppText>
        <View style={[styles.chips, { gap: theme.spacing.sm }]}>
          {details.editions.map((edition) => (
            <FilterChip
              key={edition.id}
              label={edition.title}
              selected={form.editionId === edition.id}
              onPress={() => onFormChange({ ...form, editionId: edition.id })}
            />
          ))}
        </View>
        <View style={[styles.chips, { gap: theme.spacing.sm }]}>
          <FilterChip
            label={t('library.details.physical')}
            selected={form.format === 'physical'}
            onPress={() => onFormChange({ ...form, format: 'physical' })}
          />
          <FilterChip
            label={t('library.details.digital')}
            selected={form.format === 'digital'}
            onPress={() => onFormChange({ ...form, format: 'digital' })}
          />
        </View>
        <FormInput
          label={t('library.details.labelOptional')}
          value={form.label}
          onChangeText={(label) => onFormChange({ ...form, label })}
        />
        <FormInput
          label={t('library.details.acquiredDateOptional')}
          value={form.acquiredAt}
          onChangeText={(acquiredAt) => onFormChange({ ...form, acquiredAt })}
        />
        <FormInput
          label={t('library.details.notesOptional')}
          value={form.notes}
          onChangeText={(notes) => onFormChange({ ...form, notes })}
        />
        {error ? <AppText color="error">{error}</AppText> : null}
        <Button title={t('library.details.addCopy')} loading={submitting} onPress={onSubmit} />
      </Card>
    </View>
  );
}

function CopyCard({ copy, onRemove }: { copy: LibraryCopyViewModel; onRemove: () => void }) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{copy.formatLabel}</AppText>
      <AppText color="textSecondary">{copy.editionTitle}</AppText>
      {copy.label ? <AppText>{copy.label}</AppText> : null}
      {copy.acquiredAt ? <AppText color="textSecondary">{t('library.details.acquired', { date: copy.acquiredAt })}</AppText> : null}
      {copy.notes ? <AppText color="textSecondary">{copy.notes}</AppText> : null}
      <Divider />
      <Button title={t('library.details.removeCopy')} variant="danger" onPress={onRemove} />
    </Card>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor={theme.colors.textSecondary}
      style={[
        styles.input,
        theme.typography.body,
        {
          minHeight: theme.componentHeights.input,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
  },
});
