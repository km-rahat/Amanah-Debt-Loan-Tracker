export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  OMR: 'OMR ',
  AED: 'AED ',
  SAR: 'SAR ',
};

export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'USD',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const value = amount ?? 0;
  const code = (currencyCode || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];

  const minDecimals = options?.minimumFractionDigits ?? 0;
  const maxDecimals = options?.maximumFractionDigits ?? 2;

  if (symbol && (code === 'BDT' || code === 'INR' || code === 'OMR' || code === 'AED' || code === 'SAR')) {
    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(value);
    return `${symbol}${formattedNum}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(value);
  } catch {
    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(value);
    return `${symbol || code} ${formattedNum}`;
  }
}
