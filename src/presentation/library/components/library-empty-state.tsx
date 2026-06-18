import { EmptyState } from '@/src/components/feedback';
import { Card } from '@/src/components/ui';

import { getLibraryEmptyStateContent } from './library-empty-state-content';

export interface LibraryEmptyStateProps {
  searching: boolean;
  onPrimaryAction: () => void;
}

export function LibraryEmptyState({ searching, onPrimaryAction }: LibraryEmptyStateProps) {
  const content = getLibraryEmptyStateContent(searching);

  return (
    <Card variant="outlined">
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        actionLabel={content.actionLabel}
        onAction={onPrimaryAction}
      />
    </Card>
  );
}
