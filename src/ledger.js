import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_LEDGER_PATH, DEFAULT_WALLET, nowIso } from './config.js';
import { taskSummary } from './task.js';

export function createEmptyLedger() {
  return {
    version: 1,
    wallet: DEFAULT_WALLET,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    seenTasks: {},
    submissions: [],
    completed: []
  };
}

export async function loadLedger(filePath = DEFAULT_LEDGER_PATH) {
  try {
    const text = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(text);
    return {
      ...createEmptyLedger(),
      ...parsed,
      seenTasks: parsed.seenTasks || {},
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : []
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return createEmptyLedger();
    }
    throw error;
  }
}

export async function saveLedger(ledger, filePath = DEFAULT_LEDGER_PATH) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  const next = {
    ...ledger,
    updatedAt: nowIso()
  };
  await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export function observeTasks(ledger, tasks) {
  const next = {
    ...ledger,
    seenTasks: {
      ...ledger.seenTasks
    }
  };
  const newTasks = [];
  const observedAt = nowIso();

  for (const task of tasks) {
    const summary = taskSummary(task);
    if (!summary.id) {
      continue;
    }
    const existing = next.seenTasks[summary.id];
    if (!existing) {
      newTasks.push(summary);
    }
    next.seenTasks[summary.id] = {
      ...existing,
      ...summary,
      firstSeenAt: existing?.firstSeenAt || observedAt,
      lastSeenAt: observedAt
    };
  }

  return {
    ledger: next,
    newTasks
  };
}

export function recordSubmission(ledger, submission) {
  return {
    ...ledger,
    submissions: [
      ...ledger.submissions,
      {
        createdAt: nowIso(),
        ...submission
      }
    ]
  };
}

export function recordCompleted(ledger, completed) {
  return {
    ...ledger,
    completed: [
      ...ledger.completed,
      {
        recordedAt: nowIso(),
        ...completed
      }
    ]
  };
}

export function ledgerSummary(ledger) {
  const totalMolt = ledger.completed.reduce((sum, item) => {
    const amount = Number(item.amountMolt || item.amount || 0);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  return {
    wallet: ledger.wallet,
    seenTaskCount: Object.keys(ledger.seenTasks || {}).length,
    submissionCount: ledger.submissions.length,
    completedCount: ledger.completed.length,
    totalRecordedMolt: totalMolt
  };
}
