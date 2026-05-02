export const PROMPT_PACKS = {
  visionPass: {
    id: 'vision-pass-v1',
    system:
      '현장 사진에서 공정, 위험요인, PPE, 사고유형 후보, 기인물 후보를 구조화 JSON으로 추출한다.',
    outputKeys: [
      'photoAssetId',
      'category',
      'sceneType',
      'processType',
      'locationHint',
      'ppeSignals',
      'hazardSignals',
      'accidentTypeCandidates',
      'causativeAgentCandidates',
      'confidence',
    ],
  },
  findingComposer: {
    id: 'finding-composer-v1',
    system:
      'photo_evidence를 묶어 doc7 지적사항 배열을 생성하고 위험등급, 개선요청, 법령 후보를 제안한다.',
    outputKeys: [
      'linkedPhotoIds',
      'location',
      'hazardDescription',
      'accidentType',
      'causativeAgentKey',
      'riskLevel',
      'improvementPlan',
      'legalReferenceCandidates',
      'confidence',
      'needsReview',
    ],
  },
  sectionWriter: {
    id: 'section-writer-v1',
    system:
      'doc5, doc8, doc11, doc12, doc13, doc14를 섹션별로 분리 생성하고 추측 필드는 needsReview를 유지한다.',
    sections: ['doc5', 'doc8', 'doc11', 'doc12', 'doc13', 'doc14'],
  },
  validator: {
    id: 'validator-v1',
    system:
      '표준보고서 필수값, 필드 순서, review queue, export blocking issue를 검증하고 validation_result를 반환한다.',
    outputKeys: ['valid', 'blockingIssues', 'warnings', 'reviewedFieldPaths'],
  },
} as const;

export type PromptPackId = keyof typeof PROMPT_PACKS;
