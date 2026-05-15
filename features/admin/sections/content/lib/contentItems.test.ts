import assert from 'node:assert/strict';
import test from 'node:test';

import type { SafetyContentItem } from '@/types/backend';
import {
  buildContentBody,
  buildContentTitle,
  mapContentItemToForm,
  type ContentFormState,
} from './contentItems';

function createDoc7Form(
  overrides: Partial<ContentFormState> = {},
): ContentFormState {
  return {
    accident_type: '추락',
    causative_agent_key: '',
    content_type: 'doc7_reference_material',
    title: '',
    code: '',
    text_body: '작업발판을 설치하고 안전대를 체결한다.',
    measurement_unit: '',
    image_url: 'https://example.com/reference.png',
    image_name: '',
    file_url_1: '',
    file_name_1: '',
    file_url_2: '',
    file_name_2: '',
    tags: '',
    effective_from: '',
    effective_to: '',
    is_active: true,
    sort_order: '0',
    catalog_category: '',
    catalog_expected_risk: '',
    catalog_countermeasure: '',
    catalog_legal_reference: '',
    catalog_note: '',
    ...overrides,
  };
}

function createDoc7ContentItem(body: unknown): SafetyContentItem {
  return {
    id: 'content-1',
    content_type: 'doc7_reference_material',
    title: '기존 참고자료',
    code: null,
    body,
    body_included: true,
    preview_text: '',
    attachment_summary: '',
    tags: [],
    sort_order: 0,
    effective_from: null,
    effective_to: null,
    is_active: true,
    created_at: '2026-04-21T00:00:00.000Z',
    updated_at: '2026-04-21T00:00:00.000Z',
  };
}

function createMeasurementContentItem(body: unknown): SafetyContentItem {
  return {
    ...createDoc7ContentItem(body),
    id: 'measurement-content-1',
    content_type: 'measurement_template',
    title: '가스 측정기',
  };
}

test('DOC7 참고자료 저장 바디는 4개 필드로 단순화된다', () => {
  const form = createDoc7Form();

  assert.equal(buildContentTitle(form), '추락 / 일반');
  assert.deepEqual(buildContentBody(form), {
    accidentType: '추락',
    body: '작업발판을 설치하고 안전대를 체결한다.',
    causativeAgentKey: '일반',
    imageUrl: 'https://example.com/reference.png',
  });
});

test('measurement template form stores measurementUnit in canonical body', () => {
  const form = createDoc7Form({
    content_type: 'measurement_template',
    title: '가스 측정기',
    text_body: '일산화탄소: 30ppm 미만',
    measurement_unit: 'ppm',
  });

  assert.deepEqual(buildContentBody(form), {
    instrumentName: '가스 측정기',
    safetyCriteria: '일산화탄소: 30ppm 미만',
    measurementUnit: 'ppm',
  });
});

test('measurement template form reads legacy unit aliases', () => {
  const unitForm = mapContentItemToForm(
    createMeasurementContentItem({
      instrumentName: '소음계',
      safetyCriteria: '85dB 미만',
      unit: 'dB',
    }),
  );
  const snakeForm = mapContentItemToForm(
    createMeasurementContentItem({
      instrumentName: '조도계',
      safetyCriteria: '300 Lux 이상',
      measurement_unit: 'Lux',
    }),
  );

  assert.equal(unitForm.measurement_unit, 'dB');
  assert.equal(snakeForm.measurement_unit, 'Lux');
});

test('레거시 DOC7 참고자료도 폼에서 안전하게 읽고 재저장할 수 있다', () => {
  const form = mapContentItemToForm(
    createDoc7ContentItem({
      accident_type: '추락',
      body: '개구부 주변 추락방지조치를 유지한다.',
      causative_agent_key: '1_단부_개구부',
      image_url: 'https://example.com/legacy-reference.png',
      referenceTitle1: '기존 제목 1',
      referenceTitle2: '기존 제목 2',
    }),
  );

  assert.equal(form.accident_type, '추락');
  assert.equal(form.causative_agent_key, '단부 및 개구부');
  assert.equal(form.text_body, '개구부 주변 추락방지조치를 유지한다.');
  assert.equal(form.image_url, 'https://example.com/legacy-reference.png');

  assert.deepEqual(buildContentBody(form), {
    accidentType: '추락',
    body: '개구부 주변 추락방지조치를 유지한다.',
    causativeAgentKey: '단부 및 개구부',
    imageUrl: 'https://example.com/legacy-reference.png',
  });
});
