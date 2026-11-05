const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const env = require('../config/env');

exports.login = asyncHandler(async (req, res) => {
  const { login, username, email, password } = req.body;
  const result = await authService.login(login || username || email, password);
  res.json(result);
});

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

exports.logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user, demo_mode: env.demoMode });
});
