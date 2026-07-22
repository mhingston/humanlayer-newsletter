const MAX_FUTURE_OFFSET_MS = 24 * 60 * 60 * 1000;

export function normalizeExtractedDate(
  value: string | null | undefined,
  now = new Date(),
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  if (
    Number.isNaN(timestamp) ||
    timestamp > now.getTime() + MAX_FUTURE_OFFSET_MS
  ) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}
