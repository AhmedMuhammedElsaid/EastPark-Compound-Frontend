export function formatCurrency(amount: number, currency = 'EGP'): string {
  return `${currency} ${amount.toFixed(2)}`;
}
