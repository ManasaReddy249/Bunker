const { snapshot, enrichRequest } = require('./catalogService');
const { num } = require('./helpers');

function inRange(dateValue, from, to) {
  if (!from && !to) return true;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(`${to}T23:59:59`)) return false;
  return true;
}

async function consumption(query) {
  const ctx = await snapshot();
  const rows = ctx.history.filter((h) => inRange(h.recorded_date, query.from, query.to)).map((h) => ({
    ...h,
    fuel_consumed_mt: num(h.fuel_consumed_mt),
    fuel_onboard_mt: num(h.fuel_onboard_mt),
    ship_name: ctx.ships.find((s) => Number(s.ship_id) === Number(h.ship_id))?.ship_name || null
  }));
  const byShip = {};
  for (const r of rows) {
    byShip[r.ship_name || r.ship_id] = (byShip[r.ship_name || r.ship_id] || 0) + r.fuel_consumed_mt;
  }
  return { rows, by_ship: Object.entries(byShip).map(([ship_name, mt]) => ({ ship_name, mt })) };
}

async function purchases(query) {
  const ctx = await snapshot();
  const rows = ctx.purchases
    .filter((p) => inRange(p.purchase_date, query.from, query.to))
    .map((p) => {
      const req = ctx.requests.find((r) => Number(r.request_id) === Number(p.request_id));
      return { ...p, ...(req ? enrichRequest(req, ctx) : {}), purchase_id: p.purchase_id, total_cost: num(p.total_cost) };
    });
  return { rows };
}

async function inventory() {
  const ctx = await snapshot();
  return {
    inventory: ctx.inventory.map((i) => ({ ...i, available_quantity_mt: num(i.available_quantity_mt) })),
    allocations: ctx.allocations.map((a) => ({ ...a, quantity_mt: num(a.quantity_mt) })),
    pending_requests: ctx.requests.filter((r) => !['Approved', 'Rejected'].includes(r.request_status)).map((r) => enrichRequest(r, ctx)),
    vendor_prices: ctx.vendors.map((v) => ({ vendor_name: v.vendor_name, port: v.port, fuel_type: v.fuel_type, price_per_mt: num(v.price_per_mt), status: v.status }))
  };
}

module.exports = { consumption, purchases, inventory };
