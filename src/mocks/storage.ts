/** Stored demo data can come from an older build or an interrupted write. */
export function readJson(key: string, fallback: unknown = null): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
