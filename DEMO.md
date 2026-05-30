# Demo

Date: 2026-05-30

## Tests

```text
> moltask-agent-task-bot@0.1.0 test
> node --test

✔ normalizes common API response wrappers (0.600708ms)
✔ ranks writing, coding, and research tasks above risky wallet work (1.058084ms)
✔ does not flag explicitly public no-private-data research as secret risk (0.609334ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Sample Ranking Demo

The sample fixture is synthetic ranking input only. It is not a fake Moltask submission or fake earning record.

```text
> moltask-agent-task-bot@0.1.0 demo:sample
> node ./bin/moltask-agent.js recommend --input ./examples/sample-tasks.json --limit 5

Ranked 2 agent-suitable task(s) from 3 fetched task(s).
Score  Safe  Task ID           Title                                 Reward     Why                                                   Cautions
-----  ----  ----------------  ------------------------------------  ---------  ----------------------------------------------------  --------
94     yes   sample-code-docs  Write README and demo for a public …  1000 MOLT  coding: script, api, node, cli; writing: write, rea…
53     yes   sample-research   Research public data sources for AI…  750 MOLT   writing: summarize; research: research, compare, fi…
```

## Scan And Ledger Demo

```text
> npm run cli -- scan --input ./examples/sample-tasks.json --limit 3 --ledger ./data/demo-ledger.json

Fetched 3 task(s) from ./examples/sample-tasks.json. New locally: 3.
New  Task ID             Title                                         Status  Reward
---  ------------------  --------------------------------------------  ------  ---------
yes  sample-code-docs    Write README and demo for a public API scri…  open    1000 MOLT
yes  sample-research     Research public data sources for AI agent b…  open    750 MOLT
yes  sample-wallet-risk  Swap tokens and post screenshots              open    500 MOLT

> npm run cli -- ledger --ledger ./data/demo-ledger.json

Local ledger summary
Wallet                                      Seen  Submits  Done  MOLT
------------------------------------------  ----  -------  ----  ----
0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436  3     0        0     0
```

The generated demo ledger was not committed.

## Dry-Run Submit Demo

```text
> npm run cli -- dry-run ed941502-0c70-45dd-8e42-26d04a67ac27 --message "Demo dry-run payload only; no submission made." --ledger ./data/demo-ledger.json

Dry run only. No network submission was made.
{
  "endpoint": "https://www.moltask.com/api/tasks/ed941502-0c70-45dd-8e42-26d04a67ac27/submit",
  "payload": {
    "worker_address": "0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436",
    "message": "Demo dry-run payload only; no submission made."
  }
}

> npm run cli -- ledger --ledger ./data/demo-ledger.json

Local ledger summary
Wallet                                      Seen  Submits  Done  MOLT
------------------------------------------  ----  -------  ----  ----
0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436  3     1        0     0
```

## Live Fetch Attempt

The CLI is wired for the live endpoint, but this execution environment could not resolve Moltask DNS:

```text
> npm run demo:live

> moltask-agent-task-bot@0.1.0 demo:live
> node ./bin/moltask-agent.js recommend --limit 5

Network request failed for https://www.moltask.com/api/tasks?status=open: ENOTFOUND
```

Public Moltask docs observed on 2026-05-30 list `GET /api/tasks`, `POST /api/tasks/{id}/submit`, and `GET /api/tasks/{id}/submissions`. No public claim endpoint was documented.
