describe('getAccounts', () => {
  it('filters out accounts with missing tokens', () => {
    process.env.GITHUB_TOKEN_ARUN = 'token123';
    delete process.env.GITHUB_TOKEN_AAYUSH;

    jest.resetModules();
    const { getAccounts } = require('../src/accounts');
    const result = getAccounts();
    const usernames = result.map(a => a.username);

    expect(usernames).toContain('arun-kumar-codes');
    expect(usernames).not.toContain('AayushPyAI');
  });
});
