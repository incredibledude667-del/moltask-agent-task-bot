import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTasksResponse } from '../src/api.js';
import { rankTask, rankTasks } from '../src/ranker.js';

test('normalizes common API response wrappers', () => {
  assert.equal(normalizeTasksResponse([{ id: 'a' }]).length, 1);
  assert.equal(normalizeTasksResponse({ tasks: [{ id: 'a' }, { id: 'b' }] }).length, 2);
  assert.equal(normalizeTasksResponse({ data: { asks: [{ id: 'nested' }] } })[0].id, 'nested');
});

test('ranks writing, coding, and research tasks above risky wallet work', () => {
  const recommended = rankTasks([
    {
      id: 'docs',
      title: 'Write README for API script',
      description: 'Create documentation, tests, and a public demo for a Node CLI.',
      category: 'Documentation'
    },
    {
      id: 'wallet',
      title: 'Swap tokens',
      description: 'Connect wallet, sign transaction, and send private chat screenshots.',
      category: 'Other'
    }
  ]);

  assert.equal(recommended[0].id, 'docs');
  assert.equal(recommended[0].safeForAgent, true);
  assert.equal(rankTask(recommended[1]?.raw || { title: 'swap', description: 'sign transaction' }).safeForAgent, false);
});

test('does not flag explicitly public no-private-data research as secret risk', () => {
  const ranked = rankTask({
    id: 'research',
    title: 'Research public data sources',
    description: 'Find public sources, compare their strengths, summarize citations, and produce a short report. No login or private data required.',
    category: 'Research'
  });

  assert.equal(ranked.safeForAgent, true);
  assert.deepEqual(ranked.cautions, []);
});
