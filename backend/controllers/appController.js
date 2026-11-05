const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const authService = require('../services/authService');
const catalog = require('../services/catalogService');
const dashboard = require('../services/dashboardService');
const workflow = require('../services/workflowService');
const inventory = require('../services/inventoryService');
const planning = require('../services/planningService');
const reports = require('../services/reportsService');
const { testConnection } = require('../config/db');

exports.meta = asyncHandler(async (_req, res) => {
  res.json({ name: 'BunkerSmart', demo_mode: env.demoMode, database: env.db.database, server: env.db.server });
});

exports.health = asyncHandler(async (_req, res) => {
  if (env.demoMode) return res.json({ ok: true, mode: 'demo' });
  const info = await testConnection();
  res.json({ ok: true, mode: 'sql', ...info });
});

exports.dashboardSummary = asyncHandler(async (req, res) => {
  if (req.user.role === 'User Administrator') {
    const users = await authService.listUsers();
    return res.json({ kpis: {}, role_metrics: { active_users: users.filter((u) => u.is_active).length } });
  }
  res.json(await dashboard.summary(req.user));
});
exports.dashboardShips = asyncHandler(async (_req, res) => res.json(await catalog.listShips()));
exports.dashboardConsumption = asyncHandler(async (_req, res) => res.json(await dashboard.consumption()));

exports.usersList = asyncHandler(async (_req, res) => res.json(await authService.listUsers()));
exports.usersCreate = asyncHandler(async (req, res) => res.status(201).json(await authService.createUser(req.body, req.user)));
exports.usersUpdate = asyncHandler(async (req, res) => res.json(await authService.updateUser(req.params.id, req.body)));
exports.usersStatus = asyncHandler(async (req, res) => res.json(await authService.setStatus(req.params.id, req.body.is_active)));

exports.shipsList = asyncHandler(async (_req, res) => res.json(await catalog.listShips()));
exports.shipsGet = asyncHandler(async (req, res) => res.json(await catalog.getShip(req.params.id)));
exports.shipsCreate = asyncHandler(async (req, res) => res.status(201).json(await catalog.saveShip(req.body)));
exports.shipsUpdate = asyncHandler(async (req, res) => res.json(await catalog.saveShip(req.body, req.params.id)));

exports.vendorsList = asyncHandler(async (_req, res) => res.json(await catalog.listVendors()));
exports.vendorsGet = asyncHandler(async (req, res) => {
  const all = await catalog.listVendors();
  const row = all.find((v) => Number(v.vendor_offer_id) === Number(req.params.id));
  if (!row) return res.status(404).json({ message: 'Vendor offer not found' });
  res.json(row);
});
exports.vendorsComparison = asyncHandler(async (req, res) => res.json(await catalog.vendorComparison(req.query.vendor)));

exports.requestsList = asyncHandler(async (_req, res) => res.json(await workflow.listRequests()));
exports.requestsGet = asyncHandler(async (req, res) => res.json(await workflow.getRequest(req.params.id)));
exports.requestsCreate = asyncHandler(async (req, res) => res.status(201).json(await workflow.saveRequest(req.body, req.user)));
exports.requestsUpdate = asyncHandler(async (req, res) => res.json(await workflow.saveRequest(req.body, req.user, req.params.id)));

exports.approvalsList = asyncHandler(async (_req, res) => res.json(await workflow.listApprovals()));
exports.approvalsFinal = asyncHandler(async (req, res) => res.json(await workflow.finalApproval(req.body, req.user)));

exports.purchasesList = asyncHandler(async (_req, res) => res.json(await workflow.listPurchases()));
exports.purchasesGet = asyncHandler(async (req, res) => {
  const rows = await workflow.listPurchases();
  const row = rows.find((p) => Number(p.purchase_id) === Number(req.params.id));
  if (!row) return res.status(404).json({ message: 'Purchase not found' });
  res.json(row);
});

exports.inventoryList = asyncHandler(async (_req, res) => res.json(await inventory.listInventory()));
exports.inventoryCreate = asyncHandler(async (req, res) => res.status(201).json(await inventory.upsertInventory(req.body, req.user)));
exports.inventoryUpdate = asyncHandler(async (req, res) => res.json(await inventory.upsertInventory(req.body, req.user, req.params.id)));

exports.allocationsList = asyncHandler(async (_req, res) => res.json(await inventory.listAllocations()));
exports.allocationsCreate = asyncHandler(async (req, res) => res.status(201).json(await inventory.saveAllocation(req.body, req.user)));
exports.allocationsUpdate = asyncHandler(async (req, res) => res.json(await inventory.saveAllocation(req.body, req.user, req.params.id)));

exports.planning = asyncHandler(async (_req, res) => res.json(await planning.planning()));
exports.reportsConsumption = asyncHandler(async (req, res) => res.json(await reports.consumption(req.query)));
exports.reportsPurchases = asyncHandler(async (req, res) => res.json(await reports.purchases(req.query)));
exports.reportsInventory = asyncHandler(async (_req, res) => res.json(await reports.inventory()));
