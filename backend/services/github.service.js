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

module.exports = { exchangeCodeForToken, getGithubUser, listUserRepos };

