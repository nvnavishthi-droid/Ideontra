// form-field-limits.ts — Persisted form caps matching database constraints.
export const fieldLimits = {
  title: 100,
  name: 100,
  email: 254,
  password: 128,
  text: 5000,
  links: 2000,
  comment: 2000,
  reason: 2000,
  outcome: 2000,
} as const;
