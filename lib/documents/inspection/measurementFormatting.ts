function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function compactForUnitComparison(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function formatMeasuredValueWithUnit(value: unknown, unit: unknown): string {
  const measuredValue = normalizeText(value);
  if (!measuredValue) {
    return '';
  }

  const measurementUnit = normalizeText(unit);
  if (!measurementUnit) {
    return measuredValue;
  }

  if (compactForUnitComparison(measuredValue).endsWith(compactForUnitComparison(measurementUnit))) {
    return measuredValue;
  }

  return `${measuredValue} ${measurementUnit}`;
}
