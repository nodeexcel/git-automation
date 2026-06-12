# Git Automation — Design Spec
**Date:** 2026-06-12

## Overview

A Node.js + Express.js application that automatically makes 1–10 random commits per day across 7 GitHub accounts, each to their own private repo. Commits update a text file (`activity.txt`) with the current timestamp. A Slack summary is sent at 11:30 PM daily.

---

## Accounts

| Username | Token (env var) |
|---|---|
| arun-kumar-codes | `GITHUB_TOKEN_ARUN` |
| AayushPyAI | `GITHUB_TOKEN_AAYUSH` |
| vikasexcel | `GITHUB_TOKEN_VIKAS` |
| nodeexcel | `GITHUB_TOKEN_NODE` |
| kishan-kumar-codes | `GITHUB_TOKEN_KISHAN` |
| Rahul-Khera-Codes | `GITHUB_TOKEN_RAHUL` |
| gopal-prakash-codes | `GITHUB_TOKEN_GOPAL` |

---

## Architecture

```
src/
  app.js          — Express entry point, boots scheduler
  scheduler.js    — node-cron: plans daily commit times, fires commits, sends Slack summary
  github.js       — Octokit wrapper: ensure repo exists, commit date update
  slack.js        — Sends daily summary via Slack Incoming Webhook
  accounts.js     — Static account config (reads from .env)
  store.js        — In-memory daily commit counters per account
.env              — Tokens + Slack webhook URL
```

---

## Data Flow

1. **00:00 daily** — scheduler generates 1–10 random commit times per account (between 09:00–23:00), schedules them as `setTimeout` calls.
2. **Each scheduled time** — `github.js` ensures `daily-activity` private repo exists (creates via API if not), appends a timestamp line to `activity.txt`, pushes commit.
3. **On success** — `store.js` increments that account's daily counter.
4. **23:30 daily** — `slack.js` reads counters, posts summary to Slack webhook.
5. **00:00 daily** — counters reset, new day's schedule is generated.

---

## Repo Details

- **Repo name:** `daily-activity` (private) — one per account
- **Committed file:** `activity.txt`
- **Commit content:** append line — `Committed on: 2026-06-12 14:37:22`
- **Commit author:** uses each account's username and a placeholder email (`<username>@users.noreply.github.com`)

---

## Slack Summary Format

```
Daily Commit Summary — June 12, 2026
• arun-kumar-codes: 7 commits
• AayushPyAI: 3 commits
• vikasexcel: 9 commits
• nodeexcel: 5 commits
• kishan-kumar-codes: 2 commits
• Rahul-Khera-Codes: 8 commits
• gopal-prakash-codes: 1 commit
Total: 35 commits across 7 accounts
```

---

## Error Handling

- GitHub API failure → log error, skip that commit, remaining day's commits for that account still run
- Slack webhook failure → log error, app continues normally
- Missing `.env` var → log warning at startup, skip that account

---

## Environment Variables (.env)

```
GITHUB_TOKEN_ARUN=...
GITHUB_TOKEN_AAYUSH=...
GITHUB_TOKEN_VIKAS=...
GITHUB_TOKEN_NODE=...
GITHUB_TOKEN_KISHAN=...
GITHUB_TOKEN_RAHUL=...
GITHUB_TOKEN_GOPAL=...
SLACK_WEBHOOK_URL=...
PORT=3000
```

---

## Dependencies

- `express` — HTTP server
- `node-cron` — cron scheduling (midnight reset + 11:30 PM Slack)
- `@octokit/rest` — GitHub API
- `axios` — Slack webhook HTTP call
- `dotenv` — env var loading

---

## Out of Scope

- Dashboard UI
- Persistent storage (DB) — in-memory only, resets on restart
- Retry logic for failed commits
- Multiple repos per account
