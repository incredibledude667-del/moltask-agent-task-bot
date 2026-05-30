import { getTaskCategory, getTaskDescription, getTaskId, getTaskReward, getTaskTitle, taskText } from './task.js';

const CAPABILITY_KEYWORDS = [
  ['coding', ['code', 'coding', 'program', 'script', 'bug', 'debug', 'api', 'github', 'repository', 'repo', 'test', 'typescript', 'javascript', 'python', 'node', 'automation', 'cli', 'review', 'refactor']],
  ['writing', ['write', 'writing', 'copy', 'content', 'blog', 'readme', 'documentation', 'docs', 'summarize', 'summary', 'translate', 'edit', 'proofread']],
  ['research', ['research', 'analyze', 'analysis', 'compare', 'find', 'source', 'sources', 'citation', 'citations', 'report', 'market', 'data', 'dataset', 'rank', 'benchmark', 'explain']]
];

const SAFETY_CAUTIONS = [
  ['external account required', ['tweet', 'x.com', 'twitter', 'post on', 'discord', 'telegram', 'dm ', 'social account', 'moltbook']],
  ['financial or wallet action', ['private key', 'seed phrase', 'transfer', 'send eth', 'send molt', 'buy ', 'sell ', 'trade', 'swap', 'bridge', 'sign transaction']],
  ['human-only verification', ['captcha', 'kyc', 'phone call', 'video call', 'in person', 'identity verification']],
  ['secrets or private data risk', ['cookie', 'token', 'credential', 'password', 'secret', 'private chat', 'private data']]
];

const POSITIVE_PHRASES = [
  'open source',
  'public sources',
  'public api',
  'no login',
  'pull request',
  'demo',
  'tests',
  'readme',
  'research report',
  'documentation',
  'code review'
];

export function rankTasks(tasks, options = {}) {
  const minScore = Number(options.minScore ?? 1);
  return tasks
    .map(rankTask)
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)));
}

export function rankTask(task) {
  const text = taskText(task);
  const capabilities = [];
  const reasons = [];
  const cautions = [];
  let score = 0;

  for (const [capability, keywords] of CAPABILITY_KEYWORDS) {
    const hits = keywords.filter((keyword) => includesWordish(text, keyword));
    if (hits.length) {
      capabilities.push(capability);
      const weighted = Math.min(28, hits.length * 7);
      score += weighted;
      reasons.push(`${capability}: ${hits.slice(0, 4).join(', ')}`);
    }
  }

  for (const phrase of POSITIVE_PHRASES) {
    if (text.includes(phrase)) {
      score += 5;
      reasons.push(`clear deliverable: ${phrase}`);
    }
  }

  const descriptionLength = getTaskDescription(task).length;
  if (descriptionLength >= 80) {
    score += 8;
    reasons.push('has enough detail to evaluate');
  } else if (descriptionLength > 0) {
    score += 3;
  }

  for (const [label, keywords] of SAFETY_CAUTIONS) {
    const hits = keywords.filter((keyword) => text.includes(keyword) && !isNegatedRisk(text, keyword));
    if (hits.length) {
      cautions.push(`${label}: ${hits.slice(0, 3).join(', ')}`);
      score -= label === 'external account required' ? 12 : 25;
    }
  }

  if (!capabilities.length) {
    cautions.push('no writing/coding/research match detected');
  }

  score = clamp(score, 0, 100);

  return {
    id: getTaskId(task) || '',
    title: getTaskTitle(task),
    reward: getTaskReward(task),
    category: getTaskCategory(task),
    score,
    capabilities: unique(capabilities),
    reasons: unique(reasons).slice(0, 5),
    cautions: unique(cautions),
    safeForAgent: score >= 35 && cautions.every((caution) => !caution.includes('secrets') && !caution.includes('financial')),
    raw: task
  };
}

function includesWordish(text, keyword) {
  if (keyword.includes(' ')) {
    return text.includes(keyword);
  }
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(text);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isNegatedRisk(text, keyword) {
  return [
    `no ${keyword}`,
    `no login or ${keyword}`,
    `without ${keyword}`,
    `not require ${keyword}`,
    `does not require ${keyword}`
  ].some((phrase) => text.includes(phrase));
}
