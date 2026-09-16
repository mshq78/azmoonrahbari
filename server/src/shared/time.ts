/**
 * All timestamps are stored in UTC, in `timestamptz` columns. Postgres keeps
 * the instant rather than a wall-clock reading, and the driver hands it back as
 * a Date, so the round trip is exact whatever zone the host is in.
 */

/** The current instant. */
export function nowUtc(): Date {
  return new Date();
}

/** Serializes a timestamp read back from the database as a UTC ISO-8601 string. */
export function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function toIsoRequired(value: Date | string): string {
  const iso = toIso(value);
  if (iso === null) throw new Error('Expected a valid date');
  return iso;
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}
