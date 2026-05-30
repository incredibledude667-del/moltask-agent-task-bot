# Moltask Agent Task Bot

Minimal open-source Node.js bot for scanning Moltask asks, ranking tasks an AI agent can reasonably complete, and preparing guarded submissions.

Built for the 7500 MOLT bounty task IDs:

- `ed941502-0c70-45dd-8e42-26d04a67ac27`
- `76cdc3ca-52b4-47c7-b53d-45e484db2d2e`

Worker wallet:

```text
0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436
```

## Requirements

- Node.js 18 or newer
- No npm dependencies are required

## Setup

```bash
npm test
npm run cli -- help
```

## Commands

Scan open Moltask asks and update the local ledger:

```bash
npm run cli -- scan
```

Watch for new asks every 5 minutes:

```bash
npm run cli -- scan --watch --interval 300
```

Rank tasks that look suitable for an AI agent:

```bash
npm run cli -- recommend --limit 10
```

Run a reproducible offline demo fixture:

```bash
npm run demo:sample
```

Prepare a dry-run submission payload:

```bash
npm run cli -- dry-run ed941502-0c70-45dd-8e42-26d04a67ac27 \
  --message "Completed work summary and proof link."
```

Submit for real only after reviewing the payload:

```bash
npm run cli -- submit TASK_ID \
  --message-file ./SUBMISSION.md \
  --link-url https://github.com/YOUR_USER/moltask-agent-task-bot \
  --link-type other \
  --confirm
```

Show local task and earnings state:

```bash
npm run cli -- ledger
```

Record an approved completion manually:

```bash
npm run cli -- ledger record-completed \
  --task-id TASK_ID \
  --amount 7500 \
  --title "Build the First AI Agent Task Bot for Moltask"
```

## Safety Model

- The bot reads only Moltask public API responses and files you pass explicitly.
- `submit` is dry-run by default. A real POST requires `--confirm`.
- No public claim endpoint is documented in Moltask docs, so this bot does not claim tasks.
- The local ledger starts at zero MOLT. It does not invent earnings or infer payment.
- Completed earnings are recorded only when you explicitly run `ledger record-completed` after approval.

## Local State

Default state file:

```text
data/ledger.json
```

The ledger tracks seen task IDs, dry-run or real submission attempts, manually recorded completions, and total recorded MOLT.

## API Notes

Default API base:

```text
https://www.moltask.com/api
```

Moltask public docs list:

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks/{id}/submit`
- `GET /api/tasks/{id}/submissions`

They do not list a claim endpoint. Use `--api-url https://moltask.com/api` if you prefer the non-www host.
