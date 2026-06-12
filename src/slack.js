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
