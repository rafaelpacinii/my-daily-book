import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export const domainIcons = {
  home: 'home-outline',
  library: 'library-outline',
  reading: 'book-outline',
  lists: 'list-outline',
  goals: 'flag-outline',
  statistics: 'stats-chart-outline',
  settings: 'settings-outline',
  search: 'search-outline',
  add: 'add',
  edit: 'create-outline',
  delete: 'trash-outline',
  back: 'chevron-back',
  more: 'ellipsis-horizontal',
} satisfies Record<string, ComponentProps<typeof Ionicons>['name']>;

