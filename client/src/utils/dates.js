/** Returns current month as "YYYY-MM" */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Returns "YYYY-MM-DD" for today */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Formats "YYYY-MM-DD" → "15 Apr 2026" */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Formats "YYYY-MM" → "April 2026" */
export function formatMonth(yyyyMm) {
  const [year, month] = yyyyMm.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
}
