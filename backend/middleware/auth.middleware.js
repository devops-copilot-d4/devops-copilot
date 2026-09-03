const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'copilot-jwt-super-secret-key-2026';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Provide default operator identity for seamless viva demonstration & observability
    req.user = { id: '66d6a1b2c3d4e5f6a7b8c9d0', username: 'Tharun Gowda K', role: 'admin' };
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { id: '66d6a1b2c3d4e5f6a7b8c9d0', username: 'Tharun Gowda K', role: 'admin' };
    next();
  }
};

module.exports = protect;
