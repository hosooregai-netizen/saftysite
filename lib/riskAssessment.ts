export function normalizeRiskNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

export function calculateRiskAssessmentResult(
  likelihood: unknown,
  severity: unknown
): string {
  const likelihoodNumber = normalizeRiskNumber(likelihood);
  const severityNumber = normalizeRiskNumber(severity);

  if (likelihoodNumber == null || severityNumber == null) {
    return '';
  }

  const score = likelihoodNumber * severityNumber;

  let riskLabel = '';
  if (score >= 1 && score <= 2) riskLabel = '낮음';
  else if (score >= 3 && score <= 4) riskLabel = '보통';
  else if (score >= 5) riskLabel = '높음';

  return riskLabel ? `${riskLabel} (${score})` : '';
}

