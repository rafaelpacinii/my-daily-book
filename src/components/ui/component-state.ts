import type { ThemeColorName } from '@/src/theme';

import type { BadgeVariant } from './Badge';
import type { ButtonVariant } from './Button';

export interface ComponentTone {
  backgroundToken?: ThemeColorName;
  borderToken?: ThemeColorName;
  textToken: ThemeColorName;
  transparentBackground?: boolean;
  transparentBorder?: boolean;
}

export function getButtonTone(variant: ButtonVariant, disabled: boolean): ComponentTone {
  if (disabled) {
    return {
      backgroundToken: 'disabled',
      borderToken: 'disabled',
      textToken: 'textSecondary',
    };
  }

  if (variant === 'secondary') {
    return {
      backgroundToken: 'primarySoft',
      borderToken: 'primarySoft',
      textToken: 'textPrimary',
    };
  }

  if (variant === 'outline') {
    return {
      borderToken: 'primary',
      textToken: 'primary',
      transparentBackground: true,
    };
  }

  if (variant === 'ghost') {
    return {
      textToken: 'primary',
      transparentBackground: true,
      transparentBorder: true,
    };
  }

  if (variant === 'danger') {
    return {
      backgroundToken: 'error',
      borderToken: 'error',
      textToken: 'textInverse',
    };
  }

  return {
    backgroundToken: 'primary',
    borderToken: 'primary',
    textToken: 'textInverse',
  };
}

export function getBadgeTone(variant: BadgeVariant): ComponentTone {
  if (variant === 'reading' || variant === 'active') {
    return {
      backgroundToken: 'primarySoft',
      borderToken: 'primarySoft',
      textToken: 'textPrimary',
    };
  }

  if (variant === 'read' || variant === 'completed') {
    return {
      backgroundToken: 'success',
      borderToken: 'success',
      textToken: 'textInverse',
    };
  }

  if (variant === 'dropped' || variant === 'cancelled') {
    return {
      backgroundToken: 'error',
      borderToken: 'error',
      textToken: 'textInverse',
    };
  }

  if (variant === 'to_read') {
    return {
      backgroundToken: 'surfaceSecondary',
      borderToken: 'border',
      textToken: 'textSecondary',
    };
  }

  return {
    backgroundToken: 'surfaceSecondary',
    borderToken: 'border',
    textToken: 'textPrimary',
  };
}

export function clampProgressValue(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function shouldShowOptionalAction(
  actionLabel: string | undefined,
  hasAction: boolean,
): boolean {
  return Boolean(actionLabel && hasAction);
}
