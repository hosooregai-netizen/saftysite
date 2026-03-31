export type CausativeAgentKey =
  | '1_단부_개구부'
  | '2_철골'
  | '3_지붕'
  | '4_비계_작업발판'
  | '5_굴착기'
  | '6_고소작업대'
  | '7_사다리'
  | '8_달비계'
  | '9_크레인'
  | '10_이동식비계'
  | '11_거푸집동바리'
  | '12_이동식크레인'
  | '13_화재_폭발'
  | '14_기타_위험요인'
  | 'edge_opening'
  | 'steel_frame'
  | 'roof'
  | 'ladder'
  | 'suspended_scaffold'
  | 'mobile_scaffold'
  | 'horse_scaffold'
  | 'scaffold_platform'
  | 'form_support'
  | 'mobile_crane'
  | 'excavator'
  | 'aerial_work_platform'
  | 'transport_machine'
  | 'power_tool'
  | 'construction_machine_other'
  | 'abnormal_temperature'
  | 'oxygen_deficiency'
  | 'materials'
  | 'combustibles'
  | 'other_causative';

export type CausativeAgentMap = Record<CausativeAgentKey, boolean>;

export interface CausativeAgentChecklistItem {
  key: CausativeAgentKey;
  number: number;
  label: string;
  guidance: string;
}

export interface CausativeAgentRow {
  left: CausativeAgentChecklistItem;
  right: CausativeAgentChecklistItem;
}

export interface CausativeAgentSection {
  label: string;
  rows: CausativeAgentRow[];
}

export interface CausativeAgentReport {
  agents: CausativeAgentMap;
  reasoning: string;
  photoUrl: string;
}
