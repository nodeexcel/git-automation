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
