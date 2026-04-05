# korea-safety

Hazard analysis report app built with Next.js.

Run the dev server with `npm run dev` or `npm run rundev`.
`npm run rundev` safely exits when this project already has a dev server running.

On Windows PowerShell, you can also use `.\rundev.ps1`.

## Inspection PDF Converter

Inspection PDF export is expected to use the Windows FastAPI converter server.

Set these env vars in the Next server:

- `HWPX_PDF_CONVERTER_URL=http://<windows-host>/api/v1/documents/inspection/pdf`
- `HWPX_PDF_API_KEY=<shared-secret>`

Legacy aliases `WINDOWS_HWPX_PDF_CONVERTER_URL` and `WINDOWS_HWPX_PDF_API_KEY` are also supported.

## Safety Asset Downloads

Large `/uploads/...` assets bypass the Vercel `/api/safety` proxy and are opened directly so PDF downloads do not hit the Vercel 4.5MB payload limit.

Asset base resolution order:

1. `NEXT_PUBLIC_SAFETY_ASSET_BASE_URL`
2. `NEXT_PUBLIC_SAFETY_API_UPSTREAM_BASE_URL` origin
3. `NEXT_PUBLIC_SAFETY_API_BASE_URL` origin
4. the built-in upstream origin from `lib/safetyApi/upstream.ts`

For production HTTPS deployments, set `NEXT_PUBLIC_SAFETY_ASSET_BASE_URL` to an HTTPS origin that serves `/uploads/...`. If the asset host is only available over HTTP, browsers may block the file as mixed content or an insecure download.

# safety-client
# safety-client
