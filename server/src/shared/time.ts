/**
 * All timestamps are stored in UTC. MySQL DATETIME columns carry no timezone,
 * so we convert explicitly at both ends instead of relying on the connection
 * or the host's local zone.
 */

/** The current instant, as a Date whose fields are the UTC wall-clock values MySQL should store. */
export function nowUtc(): Date {
  return new Date();
}

/** Serializes a DATETIME read back from MySQL as a UTC ISO-8601 string. */
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
