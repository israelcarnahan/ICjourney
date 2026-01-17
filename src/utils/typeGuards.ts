export const toArray = <T>(v: T[] | undefined | null): T[] => Array.isArray(v) ? v : [];
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const coerceString = (v: unknown, fallback = ''): string => isNonEmptyString(v) ? v : fallback;
