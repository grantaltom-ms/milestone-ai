export function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function percent(value: number | null): string {
  if (value === null) return 'n/a';
  return `${Math.round(value * 10) / 10}%`;
}
