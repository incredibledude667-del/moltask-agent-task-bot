import { readFile } from 'node:fs/promises';
import { DEFAULT_API_BASE, DEFAULT_LEDGER_PATH, DEFAULT_STATUS, DEFAULT_WALLET, normalizeApiBase } from './config.js';
import { fetchTasks, submitTask } from './api.js';
import { ledgerSummary, loadLedger, observeTasks, recordCompleted, recordSubmission, saveLedger } from './ledger.js';
import { printTable } from './format.js';
import { rankTasks } from './ranker.js';
import { taskSummary } from './task.js';

export async function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'scan':
      return scanCommand(rest);
    case 'recommend':
      return recommendCommand(rest);
    case 'submit':
      return submitCommand(rest);
    case 'dry-run':
      return submitCommand([...rest, '--dry-run']);
    case 'ledger':
      return ledgerCommand(rest);
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      return printHelp();
    default:
      throw new Error(`Unknown command: ${command}\nRun "npm run cli -- help" for usage.`);
  }
}

async function scanCommand(argv) {
  const options = parseOptions(argv);
  const apiBase = normalizeApiBase(options.apiUrl || options.apiBase || DEFAULT_API_BASE);
  const status = options.status === false ? '' : String(options.status || DEFAULT_STATUS);
  const ledgerPath = String(options.ledger || DEFAULT_LEDGER_PATH);
  const watch = Boolean(options.watch);
  const intervalSeconds = Math.max(15, Number(options.interval || 300));

  const runOnce = async () => {
    const tasks = await readTasks({ apiBase, status, input: options.input });
    const limit = Number(options.limit || tasks.length);
    const ledger = await loadLedger(ledgerPath);
    const observed = observeTasks(ledger, tasks);
    await saveLedger(observed.ledger, ledgerPath);
    const rows = tasks.slice(0, limit).map((task) => {
      const summary = taskSummary(task);
      return {
        new: observed.newTasks.some((item) => item.id === summary.id) ? 'yes' : '',
        id: summary.id,
        title: summary.title,
        status: summary.status,
        reward: summary.reward
      };
    });

    if (options.json) {
      console.log(JSON.stringify({ count: tasks.length, newTasks: observed.newTasks, tasks: rows }, null, 2));
    } else {
      console.log(`Fetched ${tasks.length} task(s) from ${options.input || `${apiBase}/tasks`}. New locally: ${observed.newTasks.length}.`);
      printTable(rows, [
        { key: 'new', label: 'New', maxWidth: 3 },
        { key: 'id', label: 'Task ID', maxWidth: 36 },
        { key: 'title', label: 'Title', maxWidth: 44 },
        { key: 'status', label: 'Status', maxWidth: 12 },
        { key: 'reward', label: 'Reward', maxWidth: 12 }
      ]);
    }
  };

  await runOnce();
  if (!watch) {
    return;
  }

  console.log(`Watching every ${intervalSeconds}s. Press Ctrl+C to stop.`);
  const timer = setInterval(() => {
    runOnce().catch((error) => {
      console.error(`scan failed: ${error.message}`);
    });
  }, intervalSeconds * 1000);
  await new Promise((resolve) => {
    process.on('SIGINT', () => {
      clearInterval(timer);
      resolve();
    });
  });
}

async function recommendCommand(argv) {
  const options = parseOptions(argv);
  const apiBase = normalizeApiBase(options.apiUrl || options.apiBase || DEFAULT_API_BASE);
  const status = options.status === false ? '' : String(options.status || DEFAULT_STATUS);
  const tasks = await readTasks({ apiBase, status, input: options.input });
  const recommendations = rankTasks(tasks, {
    minScore: Number(options.minScore || 1)
  });
  const limit = Number(options.limit || 10);
  const rows = recommendations.slice(0, limit).map((item) => ({
    score: item.score,
    safe: item.safeForAgent ? 'yes' : 'review',
    id: item.id,
    title: item.title,
    reward: item.reward,
    why: item.reasons.join('; '),
    cautions: item.cautions.join('; ')
  }));

  if (options.json) {
    console.log(JSON.stringify(recommendations.slice(0, limit), null, 2));
    return;
  }

  console.log(`Ranked ${recommendations.length} agent-suitable task(s) from ${tasks.length} fetched task(s).`);
  printTable(rows, [
    { key: 'score', label: 'Score', maxWidth: 5 },
    { key: 'safe', label: 'Safe', maxWidth: 6 },
    { key: 'id', label: 'Task ID', maxWidth: 36 },
    { key: 'title', label: 'Title', maxWidth: 36 },
    { key: 'reward', label: 'Reward', maxWidth: 10 },
    { key: 'why', label: 'Why', maxWidth: 52 },
    { key: 'cautions', label: 'Cautions', maxWidth: 36 }
  ]);
}

async function submitCommand(argv) {
  const options = parseOptions(argv);
  const taskId = options._[0] || options.taskId;
  if (!taskId) {
    throw new Error('submit requires a task id.');
  }
  const apiBase = normalizeApiBase(options.apiUrl || options.apiBase || DEFAULT_API_BASE);
  const ledgerPath = String(options.ledger || DEFAULT_LEDGER_PATH);
  const wallet = String(options.wallet || DEFAULT_WALLET);
  const message = await getMessage(options);
  if (!message.trim()) {
    throw new Error('submit requires --message "..." or --message-file ./path.');
  }

  const payload = {
    worker_address: wallet,
    message
  };
  if (options.linkUrl) {
    payload.link_url = String(options.linkUrl);
  }
  if (options.linkType) {
    payload.link_type = String(options.linkType);
  }

  const endpoint = `${apiBase}/tasks/${encodeURIComponent(taskId)}/submit`;
  const dryRun = options.dryRun !== false && !options.confirm;
  if (dryRun) {
    console.log('Dry run only. No network submission was made.');
    console.log(JSON.stringify({ endpoint, payload }, null, 2));
    const ledger = await loadLedger(ledgerPath);
    await saveLedger(recordSubmission(ledger, {
      taskId,
      endpoint,
      dryRun: true,
      workerAddress: wallet,
      messagePreview: message.slice(0, 240)
    }), ledgerPath);
    return;
  }

  const ledger = await loadLedger(ledgerPath);
  try {
    const result = await submitTask({ apiBase, taskId, payload });
    console.log(JSON.stringify(result, null, 2));
    await saveLedger(recordSubmission(ledger, {
      taskId,
      endpoint,
      dryRun: false,
      workerAddress: wallet,
      response: result
    }), ledgerPath);
  } catch (error) {
    await saveLedger(recordSubmission(ledger, {
      taskId,
      endpoint,
      dryRun: false,
      workerAddress: wallet,
      error: error.message,
      details: error.details || {}
    }), ledgerPath);
    throw error;
  }
}

async function ledgerCommand(argv) {
  const options = parseOptions(argv);
  const subcommand = options._[0];
  const ledgerPath = String(options.ledger || DEFAULT_LEDGER_PATH);
  const ledger = await loadLedger(ledgerPath);

  if (subcommand === 'record-completed') {
    const taskId = options.taskId || options._[1];
    if (!taskId) {
      throw new Error('ledger record-completed requires --task-id.');
    }
    const next = recordCompleted(ledger, {
      taskId: String(taskId),
      title: options.title ? String(options.title) : '',
      amountMolt: Number(options.amount || options.amountMolt || 0),
      note: options.note ? String(options.note) : ''
    });
    await saveLedger(next, ledgerPath);
    console.log(`Recorded completed task ${taskId}.`);
    return;
  }

  if (subcommand && subcommand !== 'summary') {
    throw new Error(`Unknown ledger command: ${subcommand}`);
  }

  const summary = ledgerSummary(ledger);
  if (options.json) {
    console.log(JSON.stringify({ summary, ledger }, null, 2));
    return;
  }
  console.log('Local ledger summary');
  printTable([summary], [
    { key: 'wallet', label: 'Wallet', maxWidth: 42 },
    { key: 'seenTaskCount', label: 'Seen', maxWidth: 8 },
    { key: 'submissionCount', label: 'Submits', maxWidth: 8 },
    { key: 'completedCount', label: 'Done', maxWidth: 8 },
    { key: 'totalRecordedMolt', label: 'MOLT', maxWidth: 12 }
  ]);
}

async function readTasks({ apiBase, status, input }) {
  if (input) {
    const text = await readFile(String(input), 'utf8');
    const parsed = JSON.parse(text);
    const { normalizeTasksResponse } = await import('./api.js');
    return normalizeTasksResponse(parsed);
  }
  return fetchTasks({ apiBase, status });
}

async function getMessage(options) {
  if (options.messageFile) {
    return readFile(String(options.messageFile), 'utf8');
  }
  return String(options.message || '');
}

function parseOptions(argv) {
  const options = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      options._.push(value);
      continue;
    }
    const raw = value.slice(2);
    const [keyPart, inlineValue] = raw.split(/=(.*)/s).filter((part) => part !== undefined);
    const key = toCamelCase(keyPart);
    if (keyPart.startsWith('no-')) {
      options[toCamelCase(keyPart.slice(3))] = false;
      continue;
    }
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function printHelp() {
  console.log(`moltask-agent

Usage:
  npm run cli -- scan [--watch] [--status open] [--limit 10]
  npm run cli -- recommend [--limit 10] [--min-score 1]
  npm run cli -- submit TASK_ID --message "proof..." [--link-url URL] [--confirm]
  npm run cli -- dry-run TASK_ID --message "proof..."
  npm run cli -- ledger
  npm run cli -- ledger record-completed --task-id ID --amount 7500 --title "..."

Defaults:
  API: ${DEFAULT_API_BASE}
  Wallet: ${DEFAULT_WALLET}
  Ledger: ${DEFAULT_LEDGER_PATH}

Submission safety:
  submit is dry-run by default. Add --confirm only after reviewing the payload.
  Moltask docs list a submit endpoint, but no public claim endpoint.
`);
}
