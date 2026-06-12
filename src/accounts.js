const accounts = [
  { username: 'arun-kumar-codes',    token: process.env.GITHUB_TOKEN_ARUN },
  { username: 'AayushPyAI',          token: process.env.GITHUB_TOKEN_AAYUSH },
  { username: 'vikasexcel',          token: process.env.GITHUB_TOKEN_VIKAS },
  { username: 'nodeexcel',           token: process.env.GITHUB_TOKEN_NODE },
  { username: 'kishan-kumar-codes',  token: process.env.GITHUB_TOKEN_KISHAN },
  { username: 'Rahul-Khera-Codes',   token: process.env.GITHUB_TOKEN_RAHUL },
  { username: 'gopal-prakash-codes', token: process.env.GITHUB_TOKEN_GOPAL },
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
