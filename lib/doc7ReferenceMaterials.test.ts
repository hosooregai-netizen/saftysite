import assert from 'node:assert/strict';
import test from 'node:test';

import type { CurrentHazardFinding } from '@/types/inspectionSession';
import {
  DOC7_REFERENCE_GENERAL_CAUSATIVE,
  applyDoc7ReferenceMaterialSelection,
  buildDoc7ReferenceMaterialLabel,
  clearDoc7ReferenceMaterialSelection,
  normalizeDoc7ReferenceMaterialCausativeValue,
  readDoc7ReferenceMaterialBody,
} from './doc7ReferenceMaterials';

function createFinding(): CurrentHazardFinding {
  return {
    id: 'finding-1',
    photoUrl: '',
    photoUrl2: '',
    location: '',
    hazardDescription: '',
    likelihood: '',
    severity: '',
    riskLevel: '',
    accidentType: '',
    causativeAgentKey: '',
    inspector: '',
    emphasis: '',
    improvementPlan: '',
    improvementRequest: '',
    legalReferenceId: '',
    legalReferenceTitle: '',
    referenceLawTitles: [],
    hazardCountermeasureItemId: '',
    referenceMaterial1: '',
    referenceMaterial2: '',
    referenceMaterialImage: '',
    referenceMaterialDescription: '',
    referenceCatalogAccidentType: '',
    referenceCatalogCausativeAgentKey: '',
    carryForward: false,
    metadata: '',
  };
}

test('빈 기인물은 일반으로 정규화한다', () => {
  assert.equal(
    normalizeDoc7ReferenceMaterialCausativeValue('', { fallbackToGeneral: true }),
    DOC7_REFERENCE_GENERAL_CAUSATIVE,
  );
});

test('레거시 기인물 키를 현재 라벨로 읽는다', () => {
  const body = readDoc7ReferenceMaterialBody({
    accident_type: '추락',
    body: '안전대 착용 및 작업발판 점검',
    causative_agent_key: '1_단부_개구부',
    image_url: 'https://example.com/reference.png',
    referenceTitle1: '기존 제목 1',
    referenceTitle2: '기존 제목 2',
  });

  assert.equal(body.accidentType, '추락');
  assert.equal(body.causativeAgentKey, '단부 및 개구부');
  assert.equal(body.body, '안전대 착용 및 작업발판 점검');
  assert.equal(body.imageUrl, 'https://example.com/reference.png');
});

test('선택한 참고자료를 DOC7 스냅샷 필드로 복사하고 해제할 수 있다', () => {
  const selected = applyDoc7ReferenceMaterialSelection(createFinding(), {
    body: '개구부 덮개 고정 및 출입통제',
    imageUrl: 'https://example.com/reference.png',
  });

  assert.equal(selected.referenceMaterial1, 'https://example.com/reference.png');
  assert.equal(selected.referenceMaterialImage, 'https://example.com/reference.png');
  assert.equal(selected.referenceMaterial2, '개구부 덮개 고정 및 출입통제');
  assert.equal(selected.referenceMaterialDescription, '개구부 덮개 고정 및 출입통제');

  const cleared = clearDoc7ReferenceMaterialSelection(selected);
  assert.equal(cleared.referenceMaterial1, '');
  assert.equal(cleared.referenceMaterialImage, '');
  assert.equal(cleared.referenceMaterial2, '');
  assert.equal(cleared.referenceMaterialDescription, '');
});

test('참고자료 표시 라벨은 사고유형(기인물) 형식이다', () => {
  assert.equal(
    buildDoc7ReferenceMaterialLabel({
      accidentType: '추락',
      causativeAgentKey: '',
    }),
    '추락(일반)',
  );
  assert.equal(
    buildDoc7ReferenceMaterialLabel({
      accidentType: '추락',
      causativeAgentKey: '1_단부_개구부',
    }),
    '추락(단부 및 개구부)',
  );
});
