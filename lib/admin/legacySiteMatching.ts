import type { SafetySite } from '@/types/backend';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeLegacyMatchText(value: unknown) {
  return normalizeText(value).normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeLegacyLooseMatchText(value: unknown) {
  return normalizeLegacyMatchText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

export function normalizeLegacyCompanyMatchText(value: unknown) {
  return normalizeLegacyMatchText(value)
    .replace(/주식회사|유한회사|\(주\)|㈜|\(유\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function parseLegacySiteId(value: unknown) {
  const matched = normalizeText(value).match(/legacy_insafed_site_id:([^\s]+)/);
  return matched?.[1]?.trim() || '';
}

export function buildLegacySiteMatchKey(headquarterName: string, siteName: string) {
  return `${normalizeLegacyCompanyMatchText(headquarterName)}::${normalizeLegacyLooseMatchText(siteName)}`;
}

export function getLegacySiteHeadquarterName(site: SafetySite | null | undefined) {
  return normalizeLegacyMatchText(site?.headquarter_detail?.name) || normalizeLegacyMatchText(site?.headquarter?.name);
}

export function doesLegacySiteNameMatch(left: unknown, right: unknown) {
  const normalizedLeft = normalizeLegacyMatchText(left);
  const normalizedRight = normalizeLegacyMatchText(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  if (normalizedLeft === normalizedRight) {
    return true;
  }

  return normalizeLegacyLooseMatchText(left) === normalizeLegacyLooseMatchText(right);
}

export function doesLegacySiteMatch(
  input: {
    headquarterName: string;
    siteName: string;
  },
  site: SafetySite | null | undefined,
) {
  if (!site || !doesLegacySiteNameMatch(input.siteName, site.site_name)) {
    return false;
  }

  const optionHeadquarterName = normalizeLegacyCompanyMatchText(input.headquarterName);
  const siteHeadquarterName = normalizeLegacyCompanyMatchText(getLegacySiteHeadquarterName(site));
  return !optionHeadquarterName || !siteHeadquarterName || optionHeadquarterName === siteHeadquarterName;
}
