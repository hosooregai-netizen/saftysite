export interface FieldSignatureRecord {
  id: string;
  siteId: string;
  scheduleId: string | null;
  signedByUserId: string;
  signedByName: string;
  signedAt: string;
  imageDataUrl: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
