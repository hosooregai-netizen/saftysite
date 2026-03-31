import type { CausativeAgentKey } from '@/types/siteOverview';

export const ACCIDENT_TYPE_OPTIONS = [
  '떨어짐',
  '넘어짐',
  '깔림/뒤집힘',
  '부딪힘',
  '물체에 맞음',
  '무너짐',
  '끼임',
  '절단/베임/찔림',
  '화재/폭발',
  '산소결핍',
  '감전',
  '교통사고',
  '불균형 및 무리한 동작',
  '이상 기온',
  '업무상 질병',
  '기타',
] as const;

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

export function normalizeDoc7CausativeAgentKey(
  value: CausativeAgentKey | '' | null | undefined,
): CausativeAgentKey | '' {
  if (!value) {
    return '';
  }

  return LEGACY_CAUSATIVE_AGENT_KEY_MAP[value] ?? value;
}
