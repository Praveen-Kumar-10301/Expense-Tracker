/**
 * All monetary values are stored in paise (integer).
 * 1 INR = 100 paise. Division by 100 only happens here.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

/** Format paise integer as "₹1,500.00" */
export function formatCurrency(paise) {
  return INR.format(paise / 100);
}

/** Format paise as compact string for charts: "₹1.5K" */
export function formatCurrencyCompact(paise) {
  const inr = paise / 100;
  if (inr >= 100_000) return `₹${(inr / 100_000).toFixed(1)}L`;
  if (inr >= 1_000)   return `₹${(inr / 1_000).toFixed(1)}K`;
  return `₹${inr.toFixed(0)}`;
}

/** Convert user-entered string (e.g. "150.75") to paise integer */
export function toPaise(inrString) {
  const val = parseFloat(inrString);
  if (isNaN(val) || val <= 0) return null;
  return Math.round(val * 100);
}
