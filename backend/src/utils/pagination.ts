export function positiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}
