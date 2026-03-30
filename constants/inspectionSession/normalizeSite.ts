import {
  asRecord,
  createEmptyAdminSiteSnapshot,
  createTimestamp,
  generateId,
  normalizeText,
  normalizeTimestamp,
} from '@/constants/inspectionSession/shared';
import type { InspectionSite } from '@/types/inspectionSession';

export function normalizeInspectionSite(raw: unknown): InspectionSite {
  const source = asRecord(raw);
  const snapshotSource =
    'adminSiteSnapshot' in source ? asRecord(source.adminSiteSnapshot) : source;
  const snapshot = createEmptyAdminSiteSnapshot({
    customerName: normalizeText(snapshotSource.customerName) || normalizeText(source.customerName),
    siteName: normalizeText(snapshotSource.siteName) || normalizeText(source.siteName) || normalizeText(source.title),
    assigneeName: normalizeText(snapshotSource.assigneeName) || normalizeText(source.assigneeName),
    siteManagementNumber: normalizeText(snapshotSource.siteManagementNumber),
    businessStartNumber: normalizeText(snapshotSource.businessStartNumber),
    constructionPeriod: normalizeText(snapshotSource.constructionPeriod),
    constructionAmount: normalizeText(snapshotSource.constructionAmount),
    siteManagerName: normalizeText(snapshotSource.siteManagerName),
    siteContactEmail: normalizeText(snapshotSource.siteContactEmail),
    siteAddress: normalizeText(snapshotSource.siteAddress),
    companyName: normalizeText(snapshotSource.companyName),
    corporationRegistrationNumber: normalizeText(snapshotSource.corporationRegistrationNumber),
    businessRegistrationNumber: normalizeText(snapshotSource.businessRegistrationNumber),
    licenseNumber: normalizeText(snapshotSource.licenseNumber),
    headquartersContact: normalizeText(snapshotSource.headquartersContact),
    headquartersAddress: normalizeText(snapshotSource.headquartersAddress),
  });
  const timestamp = createTimestamp();

  return {
    id: normalizeText(source.id) || generateId('site'),
    headquarterId: normalizeText(source.headquarterId),
    title: normalizeText(source.title) || snapshot.siteName || snapshot.customerName || '현장',
    customerName: snapshot.customerName,
    siteName: snapshot.siteName,
    assigneeName: snapshot.assigneeName,
    adminSiteSnapshot: snapshot,
    createdAt: normalizeTimestamp(source.createdAt, timestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, timestamp),
  };
}

