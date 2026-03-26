import type {
  CausativeAgentMap,
  CausativeAgentSection,
} from '@/types/siteOverview';

export function createEmptyCausativeAgentMap(): CausativeAgentMap {
  return {
    '1_단부_개구부': false,
    '2_철골': false,
    '3_지붕': false,
    '4_비계_작업발판': false,
    '5_굴착기': false,
    '6_고소작업대': false,
    '7_사다리': false,
    '8_달비계': false,
    '9_트럭': false,
    '10_이동식비계': false,
    '11_거푸집동바리': false,
    '12_이동식크레인': false,
    '13_화재_폭발': false,
    '14_기타_위험요인': false,
  };
}

export const CAUSATIVE_AGENT_SECTIONS: CausativeAgentSection[] = [
  {
    label: '12대 기인물',
    rows: [
      {
        left: {
          key: '1_단부_개구부',
          number: 1,
          label: '단부·개구부',
          guidance: '단부 안전난간 설치, 개구부 덮개 고정',
        },
        right: {
          key: '2_철골',
          number: 2,
          label: '철골',
          guidance: '철골 인양 전, 안전대 부착설비 설치',
        },
      },
      {
        left: {
          key: '3_지붕',
          number: 3,
          label: '지붕',
          guidance: '안전난간, 발판 설치, 채광창 덮개 설치',
        },
        right: {
          key: '4_비계_작업발판',
          number: 4,
          label: '비계·작업발판',
          guidance: '안전난간 설치, 외벽 등 추락방호망 설치',
        },
      },
      {
        left: {
          key: '5_굴착기',
          number: 5,
          label: '굴착기',
          guidance: '작업반경 출입통제, 후방 충돌방지장치 작동 확인',
        },
        right: {
          key: '6_고소작업대',
          number: 6,
          label: '고소작업대',
          guidance: '안전대 체결, 작업대 이탈 금지',
        },
      },
      {
        left: {
          key: '7_사다리',
          number: 7,
          label: '사다리',
          guidance: '안전모 착용, 2인 1조 작업',
        },
        right: {
          key: '8_달비계',
          number: 8,
          label: '달비계',
          guidance: '구명줄 안전대 체결, 2개 고정점 설치(구명줄·작업줄)',
        },
      },
      {
        left: {
          key: '9_트럭',
          number: 9,
          label: '트럭',
          guidance: '이동구간 출입통제, 전달 유도자 배치',
        },
        right: {
          key: '10_이동식비계',
          number: 10,
          label: '이동식 비계',
          guidance: '최상부 안전난간 설치',
        },
      },
      {
        left: {
          key: '11_거푸집동바리',
          number: 11,
          label: '거푸집동바리',
          guidance: '시스템동바리 사용, 하부 추락방지망 설치',
        },
        right: {
          key: '12_이동식크레인',
          number: 12,
          label: '이동식크레인',
          guidance: '인양물 고정 철저, 하부 출입통제',
        },
      },
    ],
  },
  {
    label: '기타',
    rows: [
      {
        left: {
          key: '13_화재_폭발',
          number: 13,
          label: '화재·폭발',
          guidance: '용접장치, 전기설비, 위험물질 관련 폭발 사고 예방 조치',
        },
        right: {
          key: '14_기타_위험요인',
          number: 14,
          label: '그 밖의 위험요인',
          guidance: '밀폐공간 안전조치 등 기타 위험요인 예방 조치',
        },
      },
    ],
  },
];

