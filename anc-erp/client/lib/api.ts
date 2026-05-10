import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

export function createBrowserApiClient() {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
  });
}
