export function formatMoney(cents: number | null | undefined, opts: { whole?: boolean } = {}): string {
  if (cents == null) return '';
  const whole = opts.whole ?? cents >= 100_000;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2 }).format(cents / 100);
}

export const CONDITION_LABEL: Record<string, string> = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair', poor: 'Poor' };
