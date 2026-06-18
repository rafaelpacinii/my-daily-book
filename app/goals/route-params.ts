export function getSingleRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
}

