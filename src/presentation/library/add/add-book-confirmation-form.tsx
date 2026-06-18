import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import type {
  AddBookConfirmationState,
  LibraryBookViewModel,
} from '../library-types';
import { FilterChip } from '../components';

export interface AddBookConfirmationFormProps {
  form: AddBookConfirmationState;
  existingWorks: LibraryBookViewModel[];
  message: string | null;
  submitting: boolean;
  onChange: (form: AddBookConfirmationState) => void;
  onSubmit: () => void;
}

export function AddBookConfirmationForm({
  form,
  existingWorks,
  message,
  submitting,
  onChange,
  onSubmit,
}: AddBookConfirmationFormProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <AppText variant="heading3">{t('library.confirmation.title')}</AppText>
      <AppText color="textSecondary">{t('library.confirmation.workDecision')}</AppText>
      <View style={[styles.chips, { gap: theme.spacing.sm }]}>
        <FilterChip
          label={t('library.confirmation.createNewWork')}
          selected={form.workMode === 'create'}
          onPress={() => onChange({ ...form, workMode: 'create', existingLibraryBookId: '' })}
        />
        <FilterChip
          label={t('library.confirmation.linkExistingWork')}
          selected={form.workMode === 'existing'}
          onPress={() => onChange({ ...form, workMode: 'existing' })}
        />
      </View>
      {form.workMode === 'existing' ? (
        <View style={[styles.chips, { gap: theme.spacing.sm }]}>
          {existingWorks.map((book) => (
            <FilterChip
              key={book.id}
              label={book.title}
              selected={form.existingLibraryBookId === book.id}
              onPress={() => onChange({ ...form, existingLibraryBookId: book.id })}
            />
          ))}
        </View>
      ) : null}
      <AppText color="textSecondary">{t('library.confirmation.ownership')}</AppText>
      <View style={[styles.chips, { gap: theme.spacing.sm }]}>
        <FilterChip label={t('library.confirmation.owned')} selected={form.owned} onPress={() => onChange({ ...form, owned: true })} />
        <FilterChip label={t('library.confirmation.notOwned')} selected={!form.owned} onPress={() => onChange({ ...form, owned: false })} />
      </View>
      {form.owned ? (
        <>
          <AppText color="textSecondary">{t('library.confirmation.copyFormat')}</AppText>
          <View style={[styles.chips, { gap: theme.spacing.sm }]}>
            <FilterChip
              label={t('library.formatters.physical')}
              selected={form.format === 'physical'}
              onPress={() => onChange({ ...form, format: 'physical' })}
            />
            <FilterChip
              label={t('library.formatters.digital')}
              selected={form.format === 'digital'}
              onPress={() => onChange({ ...form, format: 'digital' })}
            />
          </View>
          <FormInput label={t('library.confirmation.copyLabel')} value={form.copyLabel} onChangeText={(copyLabel) => onChange({ ...form, copyLabel })} />
          <FormInput label={t('library.confirmation.acquiredDate')} value={form.acquiredAt} onChangeText={(acquiredAt) => onChange({ ...form, acquiredAt })} />
          <FormInput label={t('library.confirmation.copyNotes')} value={form.notes} onChangeText={(notes) => onChange({ ...form, notes })} />
        </>
      ) : null}
      <AppText color="textSecondary">{t('library.confirmation.initialStatus')}</AppText>
      {message ? <AppText color="error">{message}</AppText> : null}
      <Button title={t('library.confirmation.submit')} loading={submitting} onPress={onSubmit} />
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
