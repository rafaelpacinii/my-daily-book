import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatBookFormat, formatLibraryStatus } from '../library-formatters';
import type {
  FormatFilter,
  LibraryFilters,
  LibrarySort,
  LibraryStatusFilter,
  OwnershipFilter,
} from '../library-types';
import { FilterChip } from './filter-chip';

const statusOptions: LibraryStatusFilter[] = ['all', 'to_read', 'reading', 'read', 'dropped'];
const ownershipOptions: OwnershipFilter[] = ['all', 'owned', 'not_owned'];
const formatOptions: FormatFilter[] = ['all', 'physical', 'digital'];
const sortOptions: LibrarySort[] = ['recently_added', 'title_asc', 'title_desc', 'last_read'];

export interface LibraryFilterBarProps {
  filters: LibraryFilters;
  sort: LibrarySort;
  onStatusChange: (status: LibraryStatusFilter) => void;
  onOwnershipChange: (ownership: OwnershipFilter) => void;
  onFormatChange: (format: FormatFilter) => void;
  onSortChange: (sort: LibrarySort) => void;
}

export function LibraryFilterBar({
  filters,
  sort,
  onStatusChange,
  onOwnershipChange,
  onFormatChange,
  onSortChange,
}: LibraryFilterBarProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const ownershipLabels: Record<OwnershipFilter, string> = {
    all: t('library.filters.allOwnership'),
    owned: t('library.filters.owned'),
    not_owned: t('library.filters.notOwned'),
  };

  const sortLabels: Record<LibrarySort, string> = {
    recently_added: t('library.filters.recentlyAdded'),
    title_asc: t('library.filters.titleAsc'),
    title_desc: t('library.filters.titleDesc'),
    last_read: t('library.filters.lastRead'),
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      <ChipRow label={t('library.filters.status')}>
        {statusOptions.map((option) => (
          <FilterChip
            key={option}
            label={formatLibraryStatus(option)}
            selected={filters.status === option}
            onPress={() => onStatusChange(option)}
          />
        ))}
      </ChipRow>
      <ChipRow label={t('library.filters.ownership')}>
        {ownershipOptions.map((option) => (
          <FilterChip
            key={option}
            label={ownershipLabels[option]}
            selected={filters.ownership === option}
            onPress={() => onOwnershipChange(option)}
          />
        ))}
      </ChipRow>
      <ChipRow label={t('library.filters.format')}>
        {formatOptions.map((option) => (
          <FilterChip
            key={option}
            label={option === 'all' ? t('library.filters.allFormats') : formatBookFormat(option)}
            selected={filters.format === option}
            onPress={() => onFormatChange(option)}
          />
        ))}
      </ChipRow>
      <ChipRow label={t('library.filters.sort')}>
        {sortOptions.map((option) => (
          <FilterChip
            key={option}
            label={sortLabels[option]}
            selected={sort === option}
            onPress={() => onSortChange(option)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.rowBlock}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBlock: {
    gap: 8,
  },
  chips: {
    gap: 8,
    paddingRight: 16,
  },
});
