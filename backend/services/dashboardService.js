const env = require('../config/env');
const { snapshot, enrichShip, enrichRequest } = require('./catalogService');
const { num } = require('./helpers');
const { REQUEST_STATUS } = require('../utils/constants');

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function summary(user) {
  const ctx = await snapshot();
  const ships = ctx.ships.map((s) => enrichShip(s, ctx));
  const requests = ctx.requests.map((r) => enrichRequest(r, ctx));
  const visibleRequests = user?.role === 'Executive'
    ? requests.filter((request) => Number(request.exec_id) === Number(user.user_id))
    : requests;
  const visibleRequestIds = new Set(visibleRequests.map((request) => Number(request.request_id)));
  const visiblePurchases = ctx.purchases.filter((purchase) => visibleRequestIds.has(Number(purchase.request_id)));
  const atSea = ships.filter((s) => s.ship_status === 'At Sea').length;
  const needing = ships.filter((s) => s.fuel_availability_label === 'Critical' || s.fuel_availability_label === 'Low').length;
  const inventoryTotal = ctx.inventory.reduce((acc, i) => acc + num(i.available_quantity_mt), 0);
  const active = visibleRequests.filter((r) => !['Approved', 'Rejected'].includes(r.request_status)).length;
  const pendingApprovals = visibleRequests.filter((r) => ['Pending', 'In Review', 'Vendor Confirmation'].includes(r.request_status)).length;
  const lowStock = ctx.inventory.filter((i) => num(i.available_quantity_mt) <= num(i.reorder_level_mt));

  const consumptionByMonth = {};
  for (const h of ctx.history) {
    const key = monthKey(h.recorded_date);
    if (!key) continue;
    consumptionByMonth[key] = (consumptionByMonth[key] || 0) + num(h.fuel_consumed_mt);
  }
  const purchaseByMonth = {};
  for (const p of ctx.purchases.filter((x) => x.status === 'Approved')) {
    const key = monthKey(p.purchase_date);
    if (!key) continue;
    purchaseByMonth[key] = (purchaseByMonth[key] || 0) + num(p.total_cost);
  }
  const inventoryByType = {};
  for (const i of ctx.inventory) {
    inventoryByType[i.fuel_type] = (inventoryByType[i.fuel_type] || 0) + num(i.available_quantity_mt);
  }
  const requestsByStatus = {};
  for (const request of visibleRequests) {
    requestsByStatus[request.request_status] = (requestsByStatus[request.request_status] || 0) + 1;
  }

  return {
    demo_mode: env.demoMode,
    role_metrics: {
      my_requests: visibleRequests.length,
      my_pending_requests: visibleRequests.filter((r) => ['Draft', 'Pending', 'In Review', 'Vendor Confirmation'].includes(r.request_status)).length,
      my_approved_requests: visibleRequests.filter((r) => r.request_status === 'Approved').length,
      active_requests: active,
      pending_approvals: pendingApprovals,
      approved_purchases: visiblePurchases.filter((purchase) => purchase.status === 'Approved').length,
      approved_spend: Math.round(visiblePurchases.filter((purchase) => purchase.status === 'Approved').reduce((sum, purchase) => sum + num(purchase.total_cost), 0) * 100) / 100,
      available_vendor_offers: ctx.vendors.filter((vendor) => vendor.status !== 'Unavailable').length,
      active_users: ctx.users.filter((appUser) => appUser.is_active).length,
      low_stock_items: lowStock.length
    },
    kpis: {
      total_ships: ships.length,
      ships_at_sea: atSea,
      ships_needing_fuel: needing,
      total_fuel_inventory_mt: Math.round(inventoryTotal * 100) / 100,
      active_purchase_requests: active,
      pending_approvals: pendingApprovals
    },
    consumption_trend: Object.keys(consumptionByMonth).sort().map((k) => ({ month: k, mt: Math.round(consumptionByMonth[k] * 100) / 100 })),
    purchase_trend: Object.keys(purchaseByMonth).sort().map((k) => ({ month: k, usd: Math.round(purchaseByMonth[k] * 100) / 100 })),
    request_status_distribution: Object.entries(requestsByStatus).map(([status, count]) => ({ status, count })),
    inventory_distribution: Object.entries(inventoryByType).map(([fuel_type, mt]) => ({ fuel_type, mt: Math.round(mt * 100) / 100 })),
    ship_overview: ships,
    pending_requests: requests.filter((request) => ['Pending', 'In Review', 'Vendor Confirmation'].includes(request.request_status))
      .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)).slice(0, 8),
    recent_requests: visibleRequests.slice().sort((a, b) => new Date(b.request_date) - new Date(a.request_date)).slice(0, 8),
    low_stock: lowStock,
    upcoming_requirements: ships
      .filter((s) => s.required_fuel_mt > 0)
      .sort((a, b) => b.required_fuel_mt - a.required_fuel_mt)
      .slice(0, 8)
  };
}

async function consumption() {
  const data = await summary();
  return {
    trend: data.consumption_trend,
    note: env.demoMode ? 'Demo CSV voyage readings. Not an operational forecast.' : 'Calculated from ShipHistory.fuel_consumed_mt.'
  };
}

module.exports = { summary, consumption, REQUEST_STATUS };
