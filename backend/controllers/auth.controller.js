const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { exchangeCodeForToken, getGithubUser } = require('../services/github.service');

// Step 1: redirect user to GitHub for authorization
const githubLogin = (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user`;
  res.redirect(redirectUrl);
};

// Step 2: GitHub redirects back with a code; exchange it for an access token
const githubCallback = async (req, res, next) => {
  const { code } = req.query;
  try {
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(accessToken);

    const { id, login, email, avatar_url } = githubUser;

    let user = await User.findOne({ githubId: id });
    if (!user) {
      user = await User.create({
        githubId: id,
        username: login,
        email,
        avatarUrl: avatar_url,
        accessToken,
      });
    } else {
      user.accessToken = accessToken;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`http://localhost:3000/auth/callback?token=${jwtToken}`);
  } catch (err) {
    next(err);
  }
};

// Return the current authenticated user's profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-accessToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { githubLogin, githubCallback, getMe };

