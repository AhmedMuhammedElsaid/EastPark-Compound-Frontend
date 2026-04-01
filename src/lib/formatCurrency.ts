export function formatCurrency(amount: number, currency = 'EGP', locale?: string): string {
  try {
    return new Intl.NumberFormat(locale ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
