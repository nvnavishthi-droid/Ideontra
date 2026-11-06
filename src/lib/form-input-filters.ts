// form-input-filters.ts — Consistent name and numeric input filtering.
// Keep letters, spaces, apostrophes and name punctuation.
export function filterName(value: string): string {
  return value.replace(/[^\p{L}\p{M}\s.'’-]/gu, "");
}
// Keep digits for numeric fields.
export function filterDigits(value: string): string {
  return value.replace(/\D/g, "");
}
