import { Badge } from '@/src/components/ui';
import type { ReadingCycleStatusView } from '../reading-types';

export function ReadingStatusBadge({ status, label }: { status: ReadingCycleStatusView; label: string }) {
  const variant = status === 'reading' ? 'active' : status === 'completed' ? 'completed' : 'cancelled';

  return <Badge label={label} variant={variant} />;
}
