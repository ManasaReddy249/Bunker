const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getRepos } = require('../repositories');
const HttpError = require('../utils/httpError');
const { publicUser } = require('../middleware/auth');
const { ALL_ROLES } = require('../utils/constants');

function sign(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role === 'Manager' ? 'Executive' : user.role, username: user.username },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function login(login, password) {
  const repos = getRepos();
  const user = await repos.users.findByLogin(login);
  if (!user) throw new HttpError(401, 'Invalid username or password');
  if (!user.is_active) throw new HttpError(403, 'Account is deactivated');
  const hash = user.password_hash || '';
  if (!hash.startsWith('$2')) {
    throw new HttpError(401, 'This imported account has no usable password. Use a demo login or reset the password as Administrator.');
  }
  const ok = await bcrypt.compare(password, hash);
  if (!ok) throw new HttpError(401, 'Invalid username or password');
  return { token: sign(user), user: publicUser(user) };
}

async function listUsers() {
  const repos = getRepos();
  const rows = await repos.users.list();
  return rows.map(publicUser);
}

async function createUser(payload, actor) {
  if (!ALL_ROLES.includes(payload.role)) throw new HttpError(400, 'Invalid role');
  if (actor?.role !== 'User Administrator' && payload.role !== 'Executive') {
    throw new HttpError(403, 'Only a User Administrator can assign administrator roles');
  }
  if (!payload.username || !payload.email || !payload.password) {
    throw new HttpError(400, 'Username, email and password are required');
  }
  const repos = getRepos();
  const existing = await repos.users.list();
  if (existing.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
    throw new HttpError(409, 'Username already exists');
  }
  if (existing.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new HttpError(409, 'Email already exists');
  }
  const user = await repos.users.create({
    username: payload.username,
    email: payload.email,
    password_hash: await bcrypt.hash(payload.password, 10),
    role: payload.role,
    is_active: payload.is_active !== false
  });
  return publicUser(user);
}

async function register(payload) {
  const username = String(payload.username || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  if (!username || !email || password.length < 8) {
    throw new HttpError(400, 'Enter a username, valid email and password with at least 8 characters');
  }
  const repos = getRepos();
  const existing = await repos.users.list();
  if (existing.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new HttpError(409, 'Username already exists');
  if (existing.some((u) => u.email.toLowerCase() === email)) throw new HttpError(409, 'Email already exists');
  const user = await repos.users.create({
    username, email, password_hash: await bcrypt.hash(password, 10), role: 'Executive', is_active: true
  });
  return { token: sign(user), user: publicUser(user) };
}

async function updateUser(id, payload) {
  const repos = getRepos();
  const current = await repos.users.findById(id);
  if (!current) throw new HttpError(404, 'User not found');
  const patch = {};
  if (payload.username) patch.username = payload.username;
  if (payload.email) patch.email = payload.email;
  if (payload.role) {
    if (!ALL_ROLES.includes(payload.role)) throw new HttpError(400, 'Invalid role');
    patch.role = payload.role;
  }
  if (payload.password) patch.password_hash = await bcrypt.hash(payload.password, 10);
  if (payload.is_active !== undefined) patch.is_active = !!payload.is_active;
  const updated = await repos.users.update(id, patch);
  return publicUser(updated);
}

async function setStatus(id, isActive) {
  return updateUser(id, { is_active: isActive });
}

module.exports = { login, register, listUsers, createUser, updateUser, setStatus, publicUser };
