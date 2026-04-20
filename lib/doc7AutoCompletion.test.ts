import assert from 'node:assert/strict';
import test from 'node:test';

import { createCurrentHazardFinding } from '@/constants/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import { applyDoc7AutoCompletionMatch } from './doc7AutoCompletion';

test('applyDoc7AutoCompletionMatch fills control measure and legal reference from matched catalogs', () => {
  const finding = {
    ...createCurrentHazardFinding({ inspector: '홍길동' }),
    accidentType: '추락',
    causativeAgentKey: 'edge_opening' as CausativeAgentKey,
    hazardDescription: '개구부 주변 추락 위험',
    improvementPlan: '개구부 보호조치 필요',
    improvementRequest: '개구부 보호조치 필요',
  };

  const result = applyDoc7AutoCompletionMatch(finding, {
    doc7ReferenceMaterials: [
      {
        accidentType: '추락',
        body: '개구부 추락 예방을 위해 덮개와 난간을 설치합니다.',
        causativeAgentKey: 'edge_opening',
        effectiveFrom: null,
        effectiveTo: null,
        id: 'doc7-ref-1',
        imageUrl: '/assets/ref.png',
        isActive: true,
        referenceTitle1: '관련 중대재해 사례',
        referenceTitle2: '예방대책',
        sortOrder: 0,
        title: '추락 / 단부·개구부',
      },
    ],
    hazardCountermeasureCatalog: [
      {
        category: '개구부',
        countermeasure: '안전난간과 덮개를 설치하고 출입통제를 실시한다.',
        effectiveFrom: null,
        effectiveTo: null,
        expectedRisk: '개구부 추락 위험',
        id: 'hazard-1',
        isActive: true,
        legalReference: '산업안전보건기준에 관한 규칙 제43조',
        note: '',
        sortOrder: 0,
        title: '개구부 작업',
      },
    ],
    legalReferences: [
      {
        body: '단부·개구부에는 안전난간, 울타리, 덮개 등 추락 방호조치를 적정하게 설치해야 한다.',
        id: 'rule-43-uploaded',
        referenceMaterial1: '단부 안전난간 설치 가이드',
        referenceMaterial2: '개구부 덮개 고정 점검표',
        title: '산업안전보건기준에 관한 규칙 제43조',
      },
    ],
  });

  assert.equal(result.emphasis, '안전난간과 덮개를 설치하고 출입통제를 실시한다.');
  assert.equal(result.legalReferenceId, 'rule-43-uploaded');
  assert.equal(result.legalReferenceTitle, '산업안전보건기준에 관한 규칙 제43조');
  assert.deepEqual(result.referenceLawTitles, ['산업안전보건기준에 관한 규칙 제43조']);
  assert.equal(result.referenceMaterial1, '/assets/ref.png');
});

test('applyDoc7AutoCompletionMatch preserves manually edited control measures', () => {
  const finding = {
    ...createCurrentHazardFinding({ inspector: '홍길동' }),
    accidentType: '추락',
    causativeAgentKey: 'edge_opening' as CausativeAgentKey,
    hazardDescription: '개구부 주변 추락 위험',
    emphasis: '현장 맞춤 수기 관리대책',
  };

  const result = applyDoc7AutoCompletionMatch(finding, {
    doc7ReferenceMaterials: [],
    hazardCountermeasureCatalog: [
      {
        category: '개구부',
        countermeasure: '안전난간과 덮개를 설치하고 출입통제를 실시한다.',
        effectiveFrom: null,
        effectiveTo: null,
        expectedRisk: '개구부 추락 위험',
        id: 'hazard-1',
        isActive: true,
        legalReference: '산업안전보건기준에 관한 규칙 제43조',
        note: '',
        sortOrder: 0,
        title: '개구부 작업',
      },
    ],
    legalReferences: [],
  });

  assert.equal(result.emphasis, '현장 맞춤 수기 관리대책');
});
