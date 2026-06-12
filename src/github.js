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
