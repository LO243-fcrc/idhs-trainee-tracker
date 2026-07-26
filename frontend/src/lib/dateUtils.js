/**
 * Shared date formatting utility - SINGLE SOURCE OF TRUTH
 * Handles DATE-only values and ISO datetime strings correctly
 * without timezone conversion issues
 */

export function formatDate(value) {
  if (!value) return null;

  // Handle Date objects
  if (value instanceof Date) {
    return value.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Handle ISO strings
  const isoString = String(value);
  const dateMatch = isoString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    // Parse as local date, not UTC - this prevents timezone shift
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Fallback to standard parsing
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with short month (MMM DD)
 */
export function formatDateShort(isoString) {
  if (!isoString) return null;

  const dateMatch = isoString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert ISO string to YYYY-MM-DD format for input fields
 */
export function toDateInputValue(isoString) {
  return isoString ? isoString.split('T')[0] : '';
}
