const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getRepos } = require('../repositories');
const HttpError = require('../utils/httpError');

function publicUser(user) {
  if (!user) return null;
  const role = user.role === 'Manager' ? 'Executive' : user.role;
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role,
    is_active: !!user.is_active,
    demo_account: !!user.demo_account,
    imported: !!user.imported
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    req.auth = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(new HttpError(403, 'You do not have permission for this action'));
    }
    next();
  };
}

async function attachUser(req, res, next) {
  try {
    const repos = getRepos();
    const user = await repos.users.findById(req.auth.userId);
    if (!user || !user.is_active) return next(new HttpError(401, 'Account is inactive or missing'));
    req.user = publicUser(user);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireRoles, attachUser, publicUser };
