const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET;

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) return res.status(503).json({ message: 'Authentication is not configured', code: 'AUTH_CONFIGURATION_UNAVAILABLE' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', code: 'INVALID_AUTHENTICATION_TOKEN' });
  }
};

module.exports = protect;
