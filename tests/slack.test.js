jest.mock('axios');
const axios = require('axios');
const { buildSummaryMessage } = require('../src/slack');

test('builds correct summary message', () => {
  const summary = { alice: 3, bob: 7 };
  const date = '2026-06-12';
  const message = buildSummaryMessage(summary, date);

  expect(message).toContain('Daily Commit Summary');
  expect(message).toContain('2026-06-12');
  expect(message).toContain('alice: 3 commit');
  expect(message).toContain('bob: 7 commit');
  expect(message).toContain('Total: 10 commits');
});
