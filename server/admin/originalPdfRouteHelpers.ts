function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeOriginalPdfRouteReportKey(value: unknown) {
  const normalized = normalizeText(value);
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}
