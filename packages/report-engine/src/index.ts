import path from 'node:path';

export const STANDARD_TEMPLATE_VERSION = 'standard-v1';

export const REPORT_SECTION_KEYS = [
  'doc2',
  'doc3',
  'doc4',
  'doc5',
  'doc6',
  'doc7',
  'doc8',
  'doc9',
  'doc10',
  'doc11',
  'doc12',
  'doc13',
  'doc14',
] as const;

export const LEGACY_ENGINE_ENTRYPOINTS = {
  inspectionSessionTypes: 'types/inspectionSession/session.ts',
  inspectionHwpxBuilder: 'server/documents/inspection/hwpx.ts',
  inspectionRequestResolver: 'server/documents/inspection/requestResolver.ts',
};

export function resolveTemplateAssetPath(workspaceRoot: string, filename: string) {
  return path.resolve(workspaceRoot, 'packages', 'template-assets', 'templates', filename);
}

export function describeReportEngineBridge() {
  return {
    standardTemplateVersion: STANDARD_TEMPLATE_VERSION,
    reusesLegacyInspectionSessionShape: true,
    outputModes: ['hwpx', 'pdf'],
    engineMigrationGoal: 'move current InspectionSession and HWPX binding logic behind a shared package boundary',
  };
}
