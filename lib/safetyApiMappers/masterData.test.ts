import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import type { SafetyContentItem } from '@/types/backend';
import { buildSafetyMasterData, mergeMasterDataIntoSession } from './masterData';

function createContentItem(
  id: string,
  body: Record<string, unknown>,
  sortOrder = 0,
): SafetyContentItem {
  return {
    id,
    content_type: 'measurement_template',
    title: String(body.instrumentName ?? body.instrument_name ?? id),
    code: null,
    body,
    body_included: true,
    preview_text: '',
    attachment_summary: '',
    tags: [],
    sort_order: sortOrder,
    effective_from: null,
    effective_to: null,
    is_active: true,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };
}

test('buildSafetyMasterData maps measurementUnit from canonical body', () => {
  const masterData = buildSafetyMasterData([
    createContentItem('template-gas', {
      instrumentName: 'Gas Meter',
      safetyCriteria: 'CO below 30ppm',
      measurementUnit: 'ppm',
    }),
  ]);

  assert.equal(masterData.measurementTemplates[0].measurementUnit, 'ppm');
});

test('buildSafetyMasterData maps measurement unit legacy aliases', () => {
  const masterData = buildSafetyMasterData([
    createContentItem(
      'template-noise',
      {
        instrumentName: 'Noise Meter',
        safetyCriteria: 'Below 85dB',
        measurement_unit: 'dB',
      },
      0,
    ),
    createContentItem(
      'template-light',
      {
        instrumentName: 'Light Meter',
        safetyCriteria: 'Above 300 Lux',
        unit: 'Lux',
      },
      1,
    ),
  ]);

  assert.equal(masterData.measurementTemplates[0].measurementUnit, 'dB');
  assert.equal(masterData.measurementTemplates[1].measurementUnit, 'Lux');
});

test('mergeMasterDataIntoSession fills only missing measurement units', () => {
  const masterData = buildSafetyMasterData([
    createContentItem('template-gas', {
      instrumentName: 'Gas Meter',
      safetyCriteria: 'Template criteria should not overwrite',
      measurementUnit: 'ppm',
    }),
    createContentItem('template-noise', {
      instrumentName: 'Noise Meter',
      safetyCriteria: 'Noise template criteria should not overwrite',
      measurementUnit: 'dB',
    }),
  ]);
  const session = createInspectionSession({}, 'site-1', 1);
  session.document2Overview.guidanceDate = '2026-05-01';
  session.document10Measurements = [
    {
      ...session.document10Measurements[0],
      id: 'measurement-blank-unit',
      instrumentType: 'Gas Meter',
      measuredValue: '20.9',
      measurementUnit: '',
      safetyCriteria: 'Manual criteria',
    },
    {
      ...session.document10Measurements[1],
      id: 'measurement-existing-unit',
      instrumentType: 'Noise Meter',
      measuredValue: '85',
      measurementUnit: 'custom',
      safetyCriteria: 'Existing criteria',
    },
  ];

  const merged = mergeMasterDataIntoSession(session, masterData);

  assert.equal(merged.document10Measurements[0].measurementUnit, 'ppm');
  assert.equal(merged.document10Measurements[0].measuredValue, '20.9');
  assert.equal(merged.document10Measurements[0].safetyCriteria, 'Manual criteria');
  assert.equal(merged.document10Measurements[1].measurementUnit, 'custom');
  assert.equal(merged.document10Measurements[1].safetyCriteria, 'Existing criteria');
});
