const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }

  // Extract from httpOnly cookie or Authorization header
  let token = req.cookies?.accessToken;
  if (!token && req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

module.exports = { authenticateToken };
