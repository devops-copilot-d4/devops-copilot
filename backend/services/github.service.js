const axios = require('axios');

// Exchange OAuth "code" for an access token
const exchangeCodeForToken = async (code) => {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );
  return response.data.access_token;
};

// Fetch the authenticated user's GitHub profile
const getGithubUser = async (accessToken) => {
  const response = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `token ${accessToken}` },
  });
  return response.data;
};

// List repos the user has access to (used for the "import repository" step)
const listUserRepos = async (accessToken) => {
  const response = await axios.get('https://api.github.com/user/repos', {
    headers: { Authorization: `token ${accessToken}` },
    params: { sort: 'updated', per_page: 30 },
  });
  return response.data;
};

// Parse owner and repo name from GitHub URL
const parseRepoUrl = (repoUrl) => {
  if (!repoUrl) return null;
  const cleaned = repoUrl.replace(/\.git$/, '').replace(/\/+$/, '');
  const parts = cleaned.split('/');
  if (parts.length < 2) return null;
  return {
    owner: parts[parts.length - 2],
    repo: parts[parts.length - 1],
  };
};

// Trigger a GitHub Actions workflow_dispatch event
const triggerWorkflowDispatch = async (accessToken, owner, repo, workflowName = 'build.yml', ref = 'main') => {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowName}/dispatches`;
  await axios.post(
    url,
    { ref },
    {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );
  return true;
};

// Get the latest workflow runs for a repository
const getLatestWorkflowRuns = async (accessToken, owner, repo, workflowName = 'build.yml') => {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowName}/runs`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    params: { per_page: 5 },
  });
  return response.data?.workflow_runs || [];
};

module.exports = {
  exchangeCodeForToken,
  getGithubUser,
  listUserRepos,
  parseRepoUrl,
  triggerWorkflowDispatch,
  getLatestWorkflowRuns,
};


