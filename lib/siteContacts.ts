import type {
  SafetyClientContact,
  SafetySite,
  SafetySiteManagerContact,
} from '@/types/backend';

type SiteContactSource = Pick<
  SafetySite,
  | 'manager_name'
  | 'manager_phone'
  | 'site_contact_email'
  | 'site_managers'
  | 'primary_site_manager'
  | 'client_contacts'
>;

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function hasContactValue(contact: Pick<SafetySiteManagerContact, 'name' | 'phone' | 'email'>) {
  return Boolean(
    normalizeText(contact.name) ||
      normalizeText(contact.phone) ||
      normalizeText(contact.email),
  );
}

export function normalizeSafetySiteManagers(
  site: SiteContactSource | null | undefined,
): SafetySiteManagerContact[] {
  const rawRows = Array.isArray(site?.site_managers) ? site.site_managers : [];
  const rows = rawRows
    .map((contact, index) => ({
      id: normalizeText(contact.id) || `site-manager-${index + 1}`,
      name: normalizeText(contact.name),
      phone: normalizeText(contact.phone),
      email: normalizeText(contact.email),
      is_primary: Boolean(contact.is_primary),
    }))
    .filter(hasContactValue);

  if (rows.length === 0 && site?.primary_site_manager) {
    const primary = {
      id: normalizeText(site.primary_site_manager.id) || 'primary-site-manager',
      name: normalizeText(site.primary_site_manager.name),
      phone: normalizeText(site.primary_site_manager.phone),
      email: normalizeText(site.primary_site_manager.email),
      is_primary: true,
    };
    if (hasContactValue(primary)) {
      rows.push(primary);
    }
  }

  if (rows.length === 0) {
    const legacy = {
      id: 'legacy-site-manager',
      name: normalizeText(site?.manager_name),
      phone: normalizeText(site?.manager_phone),
      email: normalizeText(site?.site_contact_email),
      is_primary: true,
    };
    if (hasContactValue(legacy)) {
      rows.push(legacy);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  let primarySeen = false;
  const normalized = rows.map((contact) => {
    const isPrimary = contact.is_primary && !primarySeen;
    if (isPrimary) primarySeen = true;
    return { ...contact, is_primary: isPrimary };
  });
  if (!primarySeen) {
    normalized[0] = { ...normalized[0], is_primary: true };
  }
  return normalized.sort((left, right) => Number(right.is_primary) - Number(left.is_primary));
}

export function getPrimarySiteManager(
  site: SiteContactSource | null | undefined,
): SafetySiteManagerContact | null {
  const managers = normalizeSafetySiteManagers(site);
  return managers.find((contact) => contact.is_primary) ?? managers[0] ?? null;
}

export function getPrimarySiteManagerName(site: SiteContactSource | null | undefined): string {
  return normalizeText(getPrimarySiteManager(site)?.name) || normalizeText(site?.manager_name);
}

export function getPrimarySiteManagerPhone(site: SiteContactSource | null | undefined): string {
  return normalizeText(getPrimarySiteManager(site)?.phone) || normalizeText(site?.manager_phone);
}

export function getPrimarySiteManagerEmail(site: SiteContactSource | null | undefined): string {
  return (
    normalizeText(getPrimarySiteManager(site)?.email) ||
    normalizeText(site?.site_contact_email)
  );
}

export function normalizeSafetyClientContacts(
  site: Pick<SafetySite, 'client_contacts'> | null | undefined,
): SafetyClientContact[] {
  return (Array.isArray(site?.client_contacts) ? site.client_contacts : [])
    .map((contact, index) => ({
      id: normalizeText(contact.id) || `client-contact-${index + 1}`,
      name: normalizeText(contact.name),
      phone: normalizeText(contact.phone),
      email: normalizeText(contact.email),
    }))
    .filter(hasContactValue);
}

