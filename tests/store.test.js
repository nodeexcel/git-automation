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
