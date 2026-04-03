export type PhotoAlbumSourceKind = 'album_upload' | 'report_legacy';

export type PhotoAlbumSourceFilter = 'all' | PhotoAlbumSourceKind;

export interface SafetyPhotoAsset {
  id: string;
  siteId: string;
  headquarterId: string;
  originalPath: string;
  thumbnailPath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
  capturedAt: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  exifJson: Record<string, unknown> | null;
  sourceKind: 'album_upload';
}

export interface PhotoAlbumItem {
  id: string;
  sourceKind: PhotoAlbumSourceKind;
  siteId: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  previewUrl: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  capturedAt: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
  sourceReportKey: string;
  sourceDocumentKey: string;
  sourceSlotKey: string;
  sourceReportTitle: string;
}

export interface PhotoAlbumListResponse {
  limit: number;
  offset: number;
  rows: PhotoAlbumItem[];
  total: number;
}
