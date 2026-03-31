const jwt = require('jsonwebtoken');

// This middleware protects routes — it checks for a valid token before allowing access
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expects: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = authMiddleware;
