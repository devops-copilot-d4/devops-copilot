const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'copilot-jwt-super-secret-key-2026';

// Default operator identity for seamless viva demonstration & observability
const DEMO_OPERATOR = { id: '66d6a1b2c3d4e5f6a7b8c9d0', username: 'Tharun Gowda K', role: 'admin' };

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In production, reject unauthenticated requests
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    // In development / demo mode, provide default operator identity
    req.user = DEMO_OPERATOR;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // In production, reject invalid tokens
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    // In development / demo mode, fall back to default operator
    req.user = DEMO_OPERATOR;
    next();
  }
};

module.exports = protect;
