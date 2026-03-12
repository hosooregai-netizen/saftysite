export type CausativeAgentKey =
  | '1_단부_개구부'
  | '2_철골'
  | '3_지붕'
  | '4_비계_작업발판'
  | '5_굴착기'
  | '6_고소작업대'
  | '7_사다리'
  | '8_달비계'
  | '9_트럭'
  | '10_이동식비계'
  | '11_거푸집동바리'
  | '12_이동식크레인'
  | '13_화재_폭발'
  | '14_기타_위험요인';

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
