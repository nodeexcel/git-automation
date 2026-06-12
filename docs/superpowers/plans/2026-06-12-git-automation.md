# Git Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js + Express.js app that makes 1–10 random daily commits per GitHub account (7 accounts), each updating `activity.txt` in a private repo, with a Slack summary at 11:30 PM.

**Architecture:** Single Express app boots a scheduler that, at midnight, generates random commit times for each account and schedules them via `setTimeout`. A `node-cron` job at 11:30 PM sends a Slack summary of daily commit counts. GitHub operations use `@octokit/rest`.

**Tech Stack:** Node.js, Express.js, node-cron, @octokit/rest, axios, dotenv

---

## File Structure

```
git-automation/
  src/
    app.js           — Express server entry point, boots scheduler
    accounts.js      — Static account config loaded from .env
    store.js         — In-memory daily commit counters, reset function
    github.js        — Octokit: ensure repo exists, commit date line to activity.txt
    slack.js         — POST daily summary to Slack Incoming Webhook
    scheduler.js     — node-cron midnight + 11:30 PM jobs, setTimeout commit dispatch
  .env               — All tokens and Slack webhook URL
  .env.example       — Template with placeholder values
  package.json
  index.js           — Entry point: require('./src/app')
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.js`
- Create: `.env.example`
- Create: `.env`
- Create: `.gitignore`

- [ ] **Step 1: Initialise npm project**

```bash
cd /Users/mac/Desktop/coding/git-automation
npm init -y
```

Expected: `package.json` created.

- [ ] **Step 2: Install dependencies**

```bash
npm install express node-cron @octokit/rest axios dotenv
npm install --save-dev jest
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 4: Create `.env.example`**

```
GITHUB_TOKEN_ARUN=
GITHUB_TOKEN_AAYUSH=
GITHUB_TOKEN_VIKAS=
GITHUB_TOKEN_NODE=
GITHUB_TOKEN_KISHAN=
GITHUB_TOKEN_RAHUL=
GITHUB_TOKEN_GOPAL=
SLACK_WEBHOOK_URL=
PORT=3000
```

- [ ] **Step 5: Create `.env` with real values**

```
GITHUB_TOKEN_ARUN=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
GITHUB_TOKEN_AAYUSH=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
GITHUB_TOKEN_VIKAS=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
GITHUB_TOKEN_NODE=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
GITHUB_TOKEN_KISHAN=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
GITHUB_TOKEN_RAHUL=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
GITHUB_TOKEN_GOPAL=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
SLACK_WEBHOOK_URL=
PORT=3000
```

- [ ] **Step 6: Create `index.js`**

```js
require('dotenv').config();
require('./src/app');
```

- [ ] **Step 7: Add start script to `package.json`**

In `package.json`, set:
```json
"scripts": {
  "start": "node index.js",
  "test": "jest"
}
```

- [ ] **Step 8: Commit**

```bash
git init
git add package.json package-lock.json index.js .env.example .gitignore
git commit -m "chore: project scaffold"
```

---

### Task 2: accounts.js — Account Config

**Files:**
- Create: `src/accounts.js`

- [ ] **Step 1: Create `src/accounts.js`**

```js
const accounts = [
  { username: 'arun-kumar-codes',   token: process.env.GITHUB_TOKEN_ARUN },
  { username: 'AayushPyAI',         token: process.env.GITHUB_TOKEN_AAYUSH },
  { username: 'vikasexcel',         token: process.env.GITHUB_TOKEN_VIKAS },
  { username: 'nodeexcel',          token: process.env.GITHUB_TOKEN_NODE },
  { username: 'kishan-kumar-codes', token: process.env.GITHUB_TOKEN_KISHAN },
  { username: 'Rahul-Khera-Codes',  token: process.env.GITHUB_TOKEN_RAHUL },
  { username: 'gopal-prakash-codes',token: process.env.GITHUB_TOKEN_GOPAL },
];

function getAccounts() {
  return accounts.filter(a => {
    if (!a.token) {
      console.warn(`[accounts] Missing token for ${a.username} — skipping`);
      return false;
    }
    return true;
  });
}

module.exports = { getAccounts };
```

- [ ] **Step 2: Write test**

Create `tests/accounts.test.js`:

```js
describe('getAccounts', () => {
  it('filters out accounts with missing tokens', () => {
    process.env.GITHUB_TOKEN_ARUN = 'token123';
    // unset one
    delete process.env.GITHUB_TOKEN_AAYUSH;

    jest.resetModules();
    const { getAccounts } = require('../src/accounts');
    const result = getAccounts();
    const usernames = result.map(a => a.username);

    expect(usernames).toContain('arun-kumar-codes');
    expect(usernames).not.toContain('AayushPyAI');
  });
});
```

- [ ] **Step 3: Run test**

```bash
npx jest tests/accounts.test.js --no-coverage
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/accounts.js tests/accounts.test.js
git commit -m "feat: add account config"
```

---

### Task 3: store.js — In-Memory Counters

**Files:**
- Create: `src/store.js`
- Create: `tests/store.test.js`

- [ ] **Step 1: Write failing test**

Create `tests/store.test.js`:

```js
const { increment, getCount, resetAll, getSummary } = require('../src/store');

beforeEach(() => resetAll());

test('starts at 0', () => {
  expect(getCount('alice')).toBe(0);
});

test('increments correctly', () => {
  increment('alice');
  increment('alice');
  expect(getCount('alice')).toBe(2);
});

test('resetAll zeros all counters', () => {
  increment('alice');
  increment('bob');
  resetAll();
  expect(getCount('alice')).toBe(0);
  expect(getCount('bob')).toBe(0);
});

test('getSummary returns all counts', () => {
  increment('alice');
  increment('bob');
  increment('bob');
  const summary = getSummary();
  expect(summary).toEqual({ alice: 1, bob: 2 });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest tests/store.test.js --no-coverage
```

Expected: FAIL — `Cannot find module '../src/store'`

- [ ] **Step 3: Implement `src/store.js`**

```js
const counts = {};

function increment(username) {
  counts[username] = (counts[username] || 0) + 1;
}

function getCount(username) {
  return counts[username] || 0;
}

function resetAll() {
  for (const key of Object.keys(counts)) {
    delete counts[key];
  }
}

function getSummary() {
  return { ...counts };
}

module.exports = { increment, getCount, resetAll, getSummary };
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest tests/store.test.js --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store.js tests/store.test.js
git commit -m "feat: add in-memory commit counter store"
```

---

### Task 4: github.js — GitHub API Wrapper

**Files:**
- Create: `src/github.js`

- [ ] **Step 1: Create `src/github.js`**

```js
const { Octokit } = require('@octokit/rest');

const REPO_NAME = 'daily-activity';

async function ensureRepo(octokit, username) {
  try {
    await octokit.repos.get({ owner: username, repo: REPO_NAME });
  } catch (err) {
    if (err.status === 404) {
      await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        private: true,
        auto_init: true,
        description: 'Daily activity tracker',
      });
      console.log(`[github] Created repo for ${username}`);
    } else {
      throw err;
    }
  }
}

async function commitDateUpdate(username, token) {
  const octokit = new Octokit({ auth: token });

  await ensureRepo(octokit, username);

  const now = new Date();
  const line = `Committed on: ${now.toISOString().replace('T', ' ').slice(0, 19)}\n`;

  // Get current file content (sha needed for update)
  let sha;
  let currentContent = '';
  try {
    const { data } = await octokit.repos.getContent({
      owner: username,
      repo: REPO_NAME,
      path: 'activity.txt',
    });
    sha = data.sha;
    currentContent = Buffer.from(data.content, 'base64').toString('utf8');
  } catch (err) {
    if (err.status !== 404) throw err;
    // File doesn't exist yet — will create it
  }

  const newContent = currentContent + line;
  const contentBase64 = Buffer.from(newContent).toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner: username,
    repo: REPO_NAME,
    path: 'activity.txt',
    message: `chore: daily activity update`,
    content: contentBase64,
    ...(sha ? { sha } : {}),
    committer: {
      name: username,
      email: `${username}@users.noreply.github.com`,
    },
    author: {
      name: username,
      email: `${username}@users.noreply.github.com`,
    },
  });

  console.log(`[github] Committed for ${username}`);
}

module.exports = { commitDateUpdate };
```

- [ ] **Step 2: Commit**

```bash
git add src/github.js
git commit -m "feat: add github api wrapper"
```

---

### Task 5: slack.js — Slack Summary

**Files:**
- Create: `src/slack.js`
- Create: `tests/slack.test.js`

- [ ] **Step 1: Write failing test**

Create `tests/slack.test.js`:

```js
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
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx jest tests/slack.test.js --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement `src/slack.js`**

```js
const axios = require('axios');

function buildSummaryMessage(summary, dateStr) {
  const lines = Object.entries(summary)
    .map(([user, count]) => `• ${user}: ${count} ${count === 1 ? 'commit' : 'commits'}`)
    .join('\n');

  const total = Object.values(summary).reduce((sum, n) => sum + n, 0);

  return `Daily Commit Summary — ${dateStr}\n${lines}\nTotal: ${total} commits across ${Object.keys(summary).length} accounts`;
}

async function sendSummary(summary) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_URL not set — skipping summary');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const text = buildSummaryMessage(summary, dateStr);

  try {
    await axios.post(webhookUrl, { text });
    console.log('[slack] Summary sent');
  } catch (err) {
    console.error('[slack] Failed to send summary:', err.message);
  }
}

module.exports = { sendSummary, buildSummaryMessage };
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest tests/slack.test.js --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/slack.js tests/slack.test.js
git commit -m "feat: add slack summary sender"
```

---

### Task 6: scheduler.js — Core Scheduler

**Files:**
- Create: `src/scheduler.js`

- [ ] **Step 1: Create `src/scheduler.js`**

```js
const cron = require('node-cron');
const { getAccounts } = require('./accounts');
const { commitDateUpdate } = require('./github');
const { increment, resetAll, getSummary } = require('./store');
const { sendSummary } = require('./slack');

const COMMIT_START_HOUR = 9;   // 9 AM
const COMMIT_END_HOUR = 23;    // 11 PM (commits before 11:30 PM summary)

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scheduleDayCommits() {
  const accounts = getAccounts();
  const now = new Date();

  for (const account of accounts) {
    const commitCount = randomBetween(1, 10);
    console.log(`[scheduler] Scheduling ${commitCount} commits for ${account.username}`);

    for (let i = 0; i < commitCount; i++) {
      const hour = randomBetween(COMMIT_START_HOUR, COMMIT_END_HOUR - 1);
      const minute = randomBetween(0, 59);

      const scheduledTime = new Date(now);
      scheduledTime.setHours(hour, minute, 0, 0);

      // Skip if time already passed today
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - Date.now();

      setTimeout(async () => {
        console.log(`[scheduler] Committing for ${account.username}`);
        try {
          await commitDateUpdate(account.username, account.token);
          increment(account.username);
        } catch (err) {
          console.error(`[scheduler] Commit failed for ${account.username}:`, err.message);
        }
      }, delay);
    }
  }
}

function startScheduler() {
  // Schedule daily reset + re-plan at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[scheduler] Midnight — resetting counters and scheduling new commits');
    resetAll();
    scheduleDayCommits();
  });

  // Send Slack summary at 11:30 PM
  cron.schedule('30 23 * * *', async () => {
    console.log('[scheduler] Sending Slack summary');
    const summary = getSummary();
    await sendSummary(summary);
  });

  // Schedule today's commits on first boot
  console.log('[scheduler] Boot — scheduling today\'s commits');
  scheduleDayCommits();
}

module.exports = { startScheduler };
```

- [ ] **Step 2: Commit**

```bash
git add src/scheduler.js
git commit -m "feat: add daily commit scheduler"
```

---

### Task 7: app.js — Express Entry Point

**Files:**
- Create: `src/app.js`

- [ ] **Step 1: Create `src/app.js`**

```js
const express = require('express');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/status', (req, res) => {
  const { getSummary } = require('./store');
  res.json({
    date: new Date().toISOString().slice(0, 10),
    commits: getSummary(),
  });
});

app.listen(PORT, () => {
  console.log(`[app] Server running on port ${PORT}`);
  startScheduler();
});

module.exports = app;
```

- [ ] **Step 2: Commit**

```bash
git add src/app.js
git commit -m "feat: add express app and boot scheduler"
```

---

### Task 8: Smoke Test — Boot and Verify

**Files:**
- No new files

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests PASS

- [ ] **Step 2: Start the server**

```bash
node index.js
```

Expected output (first few lines):
```
[app] Server running on port 3000
[scheduler] Boot — scheduling today's commits
[scheduler] Scheduling N commits for arun-kumar-codes
[scheduler] Scheduling N commits for AayushPyAI
...
```

- [ ] **Step 3: Check health endpoint**

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Check status endpoint**

```bash
curl http://localhost:3000/status
```

Expected: `{"date":"2026-06-12","commits":{}}` (empty until first commit fires)

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: complete git automation implementation"
```

---

## Self-Review Checklist

- [x] All 7 accounts covered in `accounts.js`
- [x] Repo creation via API covered in `github.js`
- [x] Random 1–10 commits per account per day in `scheduler.js`
- [x] Commits spread between 9 AM – 11 PM
- [x] `activity.txt` updated with timestamp on each commit
- [x] In-memory counters in `store.js`
- [x] Slack summary at 11:30 PM with per-account counts + total
- [x] Missing token warning at startup
- [x] Error handling: failed commits log and continue
- [x] Midnight reset + re-schedule
