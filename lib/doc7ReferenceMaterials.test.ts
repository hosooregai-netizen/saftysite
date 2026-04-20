import assert from 'node:assert/strict';
import test from 'node:test';
import { createCurrentHazardFinding } from '@/constants/inspectionSession/itemFactory';
import { applyDoc7ReferenceMaterialMatch } from './doc7ReferenceMaterials';

test('applyDoc7ReferenceMaterialMatch fills only reference material fields from catalog', () => {
  const result = applyDoc7ReferenceMaterialMatch(
    createCurrentHazardFinding({
      accidentType: '끼임',
      causativeAgentKey: '5_굴착기',
      emphasis: '수기 관리대책',
      hazardDescription: '굴착기 회전 반경에서 협착 위험',
      id: 'finding-1',
      inspector: '홍길동',
      improvementPlan: '기존 개선요청사항',
      improvementRequest: '기존 개선요청사항',
      legalReferenceId: '',
      legalReferenceTitle: '수기 법령',
      referenceCatalogAccidentType: '',
      referenceCatalogCausativeAgentKey: '',
      referenceLawTitles: ['수기 법령'],
      referenceMaterial1: '',
      referenceMaterial2: '',
      referenceMaterialDescription: '',
      referenceMaterialImage: '',
      riskLevel: '상',
    }),
    [
      {
        accidentType: '끼임',
        body: '회전 반경 내 출입 통제와 유도자 배치',
        causativeAgentKey: '5_굴착기',
        effectiveFrom: null,
        effectiveTo: null,
        id: 'ref-1',
        imageUrl: '/assets/ref.png',
        isActive: true,
        referenceTitle1: '관련 중대재해 사례',
        referenceTitle2: '예방대책',
        sortOrder: 1,
        title: '굴착기 / 끼임',
      },
    ],
  );

  assert.equal(result.referenceMaterial1, '/assets/ref.png');
  assert.equal(result.referenceMaterial2, '회전 반경 내 출입 통제와 유도자 배치');
  assert.equal(result.referenceMaterialImage, '/assets/ref.png');
  assert.equal(result.referenceMaterialDescription, '회전 반경 내 출입 통제와 유도자 배치');
  assert.equal(result.emphasis, '수기 관리대책');
  assert.equal(result.legalReferenceTitle, '수기 법령');
  assert.equal(result.improvementPlan, '기존 개선요청사항');
});
