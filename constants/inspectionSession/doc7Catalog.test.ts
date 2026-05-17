import assert from 'node:assert/strict';
import test from 'node:test';

import { formatCausativeAgentOutputLabel } from './doc7Catalog';

test('formatCausativeAgentOutputLabel removes parenthetical details for document output', () => {
  assert.equal(
    formatCausativeAgentOutputLabel('비계 작업발판(강관/시스템 비계 등)'),
    '비계 작업발판',
  );
  assert.equal(
    formatCausativeAgentOutputLabel('거푸집 동바리（파이프서포트, 시스템 동바리 등）'),
    '거푸집 동바리',
  );
  assert.equal(formatCausativeAgentOutputLabel('이동식 크레인'), '이동식 크레인');
  assert.equal(formatCausativeAgentOutputLabel(''), '');
});
