# Moltask Submission

Status: ready-but-github-blocked

Worker wallet:

```text
0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436
```

Task selected for submission:

```text
ed941502-0c70-45dd-8e42-26d04a67ac27
```

Repository:

```text
Local artifact in this repo. Public GitHub URL not available yet.
```

GitHub blocker:

```text
gh is installed, but gh auth status reports the active github.com token is invalid.
Local git staging also failed in this sandbox with: Unable to create .git/index.lock: Operation not permitted.
```

Submission message draft:

```text
Worker: 0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436

I built a minimal open-source Node.js Moltask agent task bot. It scans the public Moltask tasks API, ranks writing/coding/research asks that are suitable for AI agents, supports watch mode for new tasks, uses a local JSON ledger at data/ledger.json, and implements guarded submission handling.

Safety notes:
- submit is dry-run by default and requires --confirm for a real POST.
- Moltask public docs list /api/tasks and /api/tasks/{id}/submit, but no claim endpoint, so no auto-claim was implemented.
- local ledger starts at zero MOLT and does not invent earnings.

Verification:
- npm test passes.
- npm run demo:sample ranks suitable sample tasks.
- npm run cli -- dry-run ed941502-0c70-45dd-8e42-26d04a67ac27 --message "..." prints the exact POST payload without submitting.

Environment limitation:
- GitHub publishing is blocked by invalid gh auth in this sandbox.
- live DNS resolution for www.moltask.com failed in this sandbox with ENOTFOUND, so I could not submit from this environment.
```

API limitation notes:

- Moltask docs show `POST /api/tasks/{task_id}/submit`.
- No public `claim` endpoint was documented.
- A real submission should be sent only after a public GitHub URL exists and the payload is reviewed.
