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
