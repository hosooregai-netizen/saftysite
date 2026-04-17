import fs from 'node:fs/promises';
import path from 'node:path';

import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import {
  createActivityRecord,
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createSafetyEducationRecord,
  createSiteScenePhoto,
  padDocument12Activities,
} from '@/constants/inspectionSession/itemFactory';
import { buildInspectionHwpxDocument } from '@/server/documents/inspection/hwpx';
import { localImagePathToDataUrl } from '@/scripts/legacy_insafed/tg_local_asset';
import { convertHwpxBufferToPdfRemote } from '@/scripts/legacy_insafed/tg_remote_pdf';
import type { CausativeAgentKey } from '@/types/siteOverview';

type Scene = { title: string; photoPath: string; description: string };
type Finding = {
  photoPath: string;
  photoPath2?: string;
  location: string;
  hazardDescription: string;
  riskLevel: string;
  accidentType: string;
  causativeAgentKey: CausativeAgentKey;
  emphasis: string;
  improvementPlan: string;
  legalReferenceTitle: string;
  referenceMaterial1: string;
  referenceMaterial2: string;
};
type Measurement = {
  photoPath: string;
  instrumentType: string;
  measurementLocation: string;
  measuredValue: string;
  safetyCriteria: string;
  actionTaken: string;
};
type Education = { photoPath: string; attendeeCount: string; topic: string; content: string };
type Activity = { photoPath: string; photoPath2?: string; activityType: string; content: string };
type Config = {
  outDir: string;
  siteKey: string;
  reportNumber: number;
  meta: Record<string, string>;
  adminSiteSnapshot: Record<string, string | boolean>;
  overview: Record<string, string>;
  checkedMeasures: string[];
  doc3Scenes: Scene[];
  doc5Summary: string;
  doc7Findings: Finding[];
  doc8Plans: Array<{ processName: string; hazard: string; countermeasure: string; note?: string }>;
  doc10Measurements: Measurement[];
  doc11EducationRecords: Education[];
  doc12Activities: Activity[];
};

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key.startsWith('--') && value && !value.startsWith('--')) args.set(key, value);
    if (key === '--pdf') args.set('--pdf', 'true');
  }
  return args;
}

function uniquePhotoAssignments(config: Config) {
  const pairs = [
    ...config.doc3Scenes.map((item) => ['doc3', item.photoPath] as const),
    ...config.doc7Findings.flatMap((item) =>
      [item.photoPath, item.photoPath2].filter(Boolean).map((photo) => ['doc7', photo as string] as const),
    ),
    ...config.doc10Measurements.map((item) => ['doc10', item.photoPath] as const),
    ...config.doc11EducationRecords.map((item) => ['doc11', item.photoPath] as const),
    ...config.doc12Activities.flatMap((item) =>
      [item.photoPath, item.photoPath2].filter(Boolean).map((photo) => ['doc12', photo as string] as const),
    ),
  ];
  const seen = new Map<string, string>();
  for (const [section, photo] of pairs) {
    if (seen.has(photo)) throw new Error(`Duplicate photo assignment: ${photo} in ${seen.get(photo)} and ${section}`);
    seen.set(photo, section);
  }
  return pairs.map(([section, photo]) => ({ section, photo }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = args.get('--config');
  if (!configPath) throw new Error('Usage: node --import tsx ... --config <file> [--pdf]');

  const config = JSON.parse(await fs.readFile(path.resolve(configPath), 'utf8')) as Config;
  const usedPhotos = uniquePhotoAssignments(config);
  const outDir = path.resolve(config.outDir);
  await fs.mkdir(outDir, { recursive: true });

  const session = createInspectionSession(
    { meta: config.meta, adminSiteSnapshot: config.adminSiteSnapshot },
    config.siteKey,
    config.reportNumber,
  );
  const asDataUrl = (filePath: string) => localImagePathToDataUrl(path.resolve(filePath));

  Object.assign(session.document2Overview, config.overview);
  session.document6Measures = session.document6Measures.map((item) => ({
    ...item,
    checked: config.checkedMeasures.includes(item.key),
  }));
  config.doc3Scenes.forEach((item, index) => {
    session.document3Scenes[index] = createSiteScenePhoto(item.title, {
      photoUrl: '',
      description: item.description,
    });
  });
  for (let index = 0; index < config.doc3Scenes.length; index += 1) {
    session.document3Scenes[index].photoUrl = await asDataUrl(config.doc3Scenes[index].photoPath);
  }
  session.document5Summary.summaryText = config.doc5Summary;
  session.document7Findings = [];
  for (const item of config.doc7Findings) {
    session.document7Findings.push(
      createCurrentHazardFinding({
      photoUrl: await asDataUrl(item.photoPath),
      photoUrl2: item.photoPath2 ? await asDataUrl(item.photoPath2) : '',
      location: item.location,
      hazardDescription: item.hazardDescription,
      riskLevel: item.riskLevel,
      accidentType: item.accidentType,
      causativeAgentKey: item.causativeAgentKey,
      inspector: session.meta.drafter,
      emphasis: item.emphasis,
      improvementPlan: item.improvementPlan,
      legalReferenceTitle: item.legalReferenceTitle,
      referenceMaterial1: item.referenceMaterial1,
      referenceMaterial2: item.referenceMaterial2,
    }),
    );
  }
  session.document8Plans = config.doc8Plans.map((item) => createFutureProcessRiskPlan(item));
  session.document10Measurements = [];
  for (const item of config.doc10Measurements) {
    session.document10Measurements.push(
      createMeasurementCheckItem({ ...item, photoUrl: await asDataUrl(item.photoPath) }),
    );
  }
  session.document11EducationRecords = [];
  for (const item of config.doc11EducationRecords) {
    session.document11EducationRecords.push(
      createSafetyEducationRecord({ ...item, photoUrl: await asDataUrl(item.photoPath) }),
    );
  }
  const activityRows = [];
  for (const item of config.doc12Activities) {
    activityRows.push(
      createActivityRecord({
        activityType: item.activityType,
        content: item.content,
        photoUrl: await asDataUrl(item.photoPath),
        photoUrl2: item.photoPath2 ? await asDataUrl(item.photoPath2) : '',
      }),
    );
  }
  session.document12Activities = padDocument12Activities(activityRows);
  session.document9SafetyChecks.tbm.forEach((item, index) => {
    item.rating = index < 3 ? 'good' : 'average';
    item.note = index === 0 ? '작업 시작 전 공정·장비·보행동선을 공유함.' : '';
  });
  session.document9SafetyChecks.riskAssessment.forEach((item, index) => {
    item.rating = index < 3 ? 'average' : 'good';
    item.note = index === 1 ? '굴착기 작업반경 및 보행자 통제 위험요인을 재점검함.' : '';
  });

  const document = await buildInspectionHwpxDocument(session, [session]);
  const sessionPath = path.join(outDir, 'photo-sample.session.json');
  const hwpxPath = path.join(outDir, 'photo-sample-report.hwpx');
  await fs.writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  await fs.writeFile(hwpxPath, new Uint8Array(document.buffer));

  const manifest: Record<string, unknown> = { configPath: path.resolve(configPath), sessionPath, hwpxPath, usedPhotos };
  if (args.get('--pdf') === 'true') {
    const converted = await convertHwpxBufferToPdfRemote(Buffer.from(document.buffer), document.filename);
    const pdfPath = path.join(outDir, 'photo-sample-report.pdf');
    await fs.writeFile(pdfPath, converted.buffer);
    manifest.pdfPath = pdfPath;
  }

  const manifestPath = path.join(outDir, 'photo-sample.manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
