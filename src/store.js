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
