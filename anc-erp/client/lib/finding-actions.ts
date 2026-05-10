import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

function createFindingApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createRoundFindingDraft(
  inspectionRoundId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).createInspectionRoundFinding(inspectionRoundId, payload);
}

export async function updateFindingDraft(
  findingId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).updateFinding(findingId, payload);
}

export async function createCorrectiveActionDraft(
  findingId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).createCorrectiveAction(findingId, payload);
}

export async function updateCorrectiveActionDraft(
  actionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).updateCorrectiveAction(actionId, payload);
}

export async function verifyCorrectiveActionDraft(
  actionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).verifyCorrectiveAction(actionId, payload);
}

export async function rejectCorrectiveActionDraft(
  actionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).rejectCorrectiveAction(actionId, payload);
}

export async function uploadFindingEvidencePhoto(
  findingId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).uploadFindingPhoto(findingId, payload);
}

export async function saveEvidencePhotoMarkup(
  photoId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).markupEvidencePhoto(photoId, payload);
}

export async function saveEvidencePhotoCaption(
  photoId: string,
  caption: string,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).setEvidencePhotoCaption(photoId, { caption });
}

export async function markEvidencePhotoRepresentative(
  photoId: string,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).setRepresentativeEvidencePhoto(photoId);
}

export async function updatePhotoLedgerEntryDraft(
  entryId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).updatePhotoLedgerEntry(entryId, payload);
}

export async function validatePhotoLedgerDraft(
  photoLedgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).validatePhotoLedger(photoLedgerId);
}

export async function draftActionRequestMailForFindings(
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).draftActionRequestMail(payload);
}

export async function sendActionRequestMailDraft(
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createFindingApi(fetchImpl).sendActionRequestMail(payload);
}
