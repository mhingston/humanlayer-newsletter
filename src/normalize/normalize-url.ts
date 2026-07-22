const TRACKING_PARAMETER_NAMES = new Set(["fbclid", "gclid"]);

export function normalizeCanonicalUrl(
  value: string,
  sourceUrl: string,
): string | null {
  try {
    if (/\s/.test(value)) {
      return null;
    }

    const url = new URL(value, sourceUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    for (const parameter of [...url.searchParams.keys()]) {
      if (
        parameter.toLowerCase().startsWith("utm_") ||
        TRACKING_PARAMETER_NAMES.has(parameter.toLowerCase())
      ) {
        url.searchParams.delete(parameter);
      }
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
