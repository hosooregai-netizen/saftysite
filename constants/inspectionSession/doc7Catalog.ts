import { ACCIDENT_TYPE_OPTIONS } from '@/constants/inspectionSession/catalog';

export { ACCIDENT_TYPE_OPTIONS };

import type { CausativeAgentKey } from '@/types/siteOverview';

export const CAUSATIVE_AGENT_OPTIONS: Array<{
  key: CausativeAgentKey;
  number: number;
  label: string;
  guidance: string;
}> = [
  { key: 'edge_opening', number: 1, label: '단부 및 개구부', guidance: '' },
  { key: 'steel_frame', number: 2, label: '철골', guidance: '' },
  { key: 'roof', number: 3, label: '지붕', guidance: '' },
  { key: 'ladder', number: 4, label: '사다리', guidance: '' },
  { key: 'suspended_scaffold', number: 5, label: '달비계', guidance: '' },
  { key: 'mobile_scaffold', number: 6, label: '이동식 비계', guidance: '' },
  { key: 'horse_scaffold', number: 7, label: '말비계', guidance: '' },
  { key: 'scaffold_platform', number: 8, label: '비계 작업발판(강관/시스템 비계 등)', guidance: '' },
  { key: 'form_support', number: 9, label: '거푸집 동바리(파이프서포트, 시스템 동바리 등)', guidance: '' },
  { key: 'mobile_crane', number: 10, label: '이동식 크레인', guidance: '' },
  { key: 'excavator', number: 11, label: '굴착기', guidance: '' },
  { key: 'aerial_work_platform', number: 12, label: '고소작업대', guidance: '' },
  { key: 'transport_machine', number: 13, label: '하역 운반기계(트럭, 지게차)', guidance: '' },
  { key: 'power_tool', number: 14, label: '전동기구', guidance: '' },
  { key: 'construction_machine_other', number: 15, label: '건설기계(굴착기 제외)', guidance: '' },
  { key: 'abnormal_temperature', number: 16, label: '이상기온(폭염/한랭)', guidance: '' },
  { key: 'oxygen_deficiency', number: 17, label: '산소결핍', guidance: '' },
  { key: 'materials', number: 18, label: '자재', guidance: '' },
  { key: 'combustibles', number: 19, label: '가연물', guidance: '' },
  { key: 'other_causative', number: 20, label: '기타', guidance: '' },
] as const;

const LEGACY_CAUSATIVE_AGENT_LABELS: Partial<Record<CausativeAgentKey, string>> = {
  '1_단부_개구부': '단부 및 개구부',
  '2_철골': '철골',
  '3_지붕': '지붕',
  '4_비계_작업발판': '비계 작업발판(강관/시스템 비계 등)',
  '5_굴착기': '굴착기',
  '6_고소작업대': '고소작업대',
  '7_사다리': '사다리',
  '8_달비계': '달비계',
  '9_크레인': '이동식 크레인',
  '10_이동식비계': '이동식 비계',
  '11_거푸집동바리': '거푸집 동바리(파이프서포트, 시스템 동바리 등)',
  '12_이동식크레인': '이동식 크레인',
  '13_화재_폭발': '가연물',
  '14_기타_위험요인': '기타',
};

export const LEGACY_CAUSATIVE_AGENT_KEY_MAP: Partial<Record<CausativeAgentKey, CausativeAgentKey>> = {
  '1_단부_개구부': 'edge_opening',
  '2_철골': 'steel_frame',
  '3_지붕': 'roof',
  '4_비계_작업발판': 'scaffold_platform',
  '5_굴착기': 'excavator',
  '6_고소작업대': 'aerial_work_platform',
  '7_사다리': 'ladder',
  '8_달비계': 'suspended_scaffold',
  '9_크레인': 'mobile_crane',
  '10_이동식비계': 'mobile_scaffold',
  '11_거푸집동바리': 'form_support',
  '12_이동식크레인': 'mobile_crane',
  '13_화재_폭발': 'combustibles',
  '14_기타_위험요인': 'other_causative',
};

export const CATALOG_COMPATIBLE_CAUSATIVE_KEYS: Partial<Record<CausativeAgentKey, CausativeAgentKey[]>> = {
  edge_opening: ['edge_opening', '1_단부_개구부'],
  steel_frame: ['steel_frame', '2_철골'],
  roof: ['roof', '3_지붕'],
  ladder: ['ladder', '7_사다리'],
  suspended_scaffold: ['suspended_scaffold', '8_달비계'],
  mobile_scaffold: ['mobile_scaffold', '10_이동식비계'],
  horse_scaffold: ['horse_scaffold'],
  scaffold_platform: ['scaffold_platform', '4_비계_작업발판'],
  form_support: ['form_support', '11_거푸집동바리'],
  mobile_crane: ['mobile_crane', '9_크레인', '12_이동식크레인'],
  excavator: ['excavator', '5_굴착기'],
  aerial_work_platform: ['aerial_work_platform', '6_고소작업대'],
  transport_machine: ['transport_machine'],
  power_tool: ['power_tool'],
  construction_machine_other: ['construction_machine_other'],
  abnormal_temperature: ['abnormal_temperature'],
  oxygen_deficiency: ['oxygen_deficiency'],
  materials: ['materials'],
  combustibles: ['combustibles', '13_화재_폭발'],
  other_causative: ['other_causative', '14_기타_위험요인'],
};

export const CAUSATIVE_AGENT_LABELS = {
  ...LEGACY_CAUSATIVE_AGENT_LABELS,
  ...Object.fromEntries(CAUSATIVE_AGENT_OPTIONS.map((item) => [item.key, item.label])),
} as Record<CausativeAgentKey, string>;

const ACCIDENT_TYPE_COMPATIBILITY_MAP: Record<string, string[]> = {
  '\uB5A8\uC5B4\uC9D0': ['\uB5A8\uC5B4\uC9D0', '\uCD94\uB77D'],
  '\uB118\uC5B4\uC9D0': ['\uB118\uC5B4\uC9D0', '\uBBF8\uB044\uB7EC\uC9D0'],
  '\uAE54\uB9BC/\uB4A4\uC9D1\uD798': [
    '\uAE54\uB9BC/\uB4A4\uC9D1\uD798',
    '\uAE54\uB9BC',
    '\uB4A4\uC9D1\uD798',
    '\uC804\uB3C4',
    '\uB9E4\uBAB0',
    '\uB9E4\uBAB02',
  ],
  '\uBD80\uB51B\uD798': ['\uBD80\uB51B\uD798', '\uCDA9\uB3CC'],
  '\uBB3C\uCCB4\uC5D0 \uB9DE\uC74C': [
    '\uBB3C\uCCB4\uC5D0 \uB9DE\uC74C',
    '\uB9DE\uC74C',
    '\uB099\uD558',
  ],
  '\uBB34\uB108\uC9D0': ['\uBB34\uB108\uC9D0', '\uBD95\uAD34'],
  '\uB07C\uC784': ['\uB07C\uC784'],
  '\uC808\uB2E8/\uBCA0\uC784/\uCC14\uB9BC': [
    '\uC808\uB2E8/\uBCA0\uC784/\uCC14\uB9BC',
    '\uC808\uB2E8',
    '\uBCA0\uC784',
    '\uCC14\uB9BC',
  ],
  '\uD654\uC7AC/\uD3ED\uBC1C': [
    '\uD654\uC7AC/\uD3ED\uBC1C',
    '\uD654\uC7AC\u00B7\uD3ED\uBC1C',
    '\uD654\uC0C1',
  ],
  '\uC0B0\uC18C\uACB0\uD54D': ['\uC0B0\uC18C\uACB0\uD54D'],
  '\uAC10\uC804': ['\uAC10\uC804'],
  '\uAD50\uD1B5\uC0AC\uACE0': ['\uAD50\uD1B5\uC0AC\uACE0'],
  '\uBD88\uADE0\uD615 \uBC0F \uBB34\uB9AC\uD55C \uB3D9\uC791': [
    '\uBD88\uADE0\uD615 \uBC0F \uBB34\uB9AC\uD55C \uB3D9\uC791',
    '\uBD88\uADE0\uD615',
    '\uBB34\uB9AC\uD55C \uB3D9\uC791',
    '\uADFC\uACE8\uACA9',
  ],
  '\uC774\uC0C1 \uAE30\uC628': [
    '\uC774\uC0C1 \uAE30\uC628',
    '\uC774\uC0C1\uAE30\uC628',
    '\uD3ED\uC5FC',
    '\uD55C\uB7AD',
  ],
  '\uC5C5\uBB34\uC0C1 \uC9C8\uBCD1': [
    '\uC5C5\uBB34\uC0C1 \uC9C8\uBCD1',
    '\uC9C8\uBCD1',
    '\uC9C1\uC5C5\uBCD1',
  ],
  '\uAE30\uD0C0': ['\uAE30\uD0C0'],
};

export function getCompatibleDoc7AccidentTypes(value: string | null | undefined): string[] {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return [];
  }

  for (const aliases of Object.values(ACCIDENT_TYPE_COMPATIBILITY_MAP)) {
    if (aliases.includes(normalized)) {
      return aliases;
    }
  }

  return [normalized];
}

export function normalizeDoc7CausativeAgentKey(
  value: string | null | undefined,
): string {
  if (!value) {
    return '';
  }

  return (LEGACY_CAUSATIVE_AGENT_KEY_MAP[value as CausativeAgentKey] ?? value) as string;
}
