const { getRepos } = require('../repositories');
const HttpError = require('../utils/httpError');
const { snapshot } = require('./catalogService');
const { num, userMap } = require('./helpers');
const { FUEL_TYPES } = require('../utils/constants');

async function listInventory() {
  const ctx = await snapshot();
  const users = userMap(ctx.users);
  const allocated = {};
  for (const a of ctx.allocations) {
    if (a.status === 'Cancelled') continue;
    allocated[a.fuel_type] = (allocated[a.fuel_type] || 0) + num(a.quantity_mt);
  }
  const rows = ctx.inventory.map((i) => ({
    ...i,
    available_quantity_mt: num(i.available_quantity_mt),
    reorder_level_mt: num(i.reorder_level_mt),
    is_low: num(i.available_quantity_mt) <= num(i.reorder_level_mt),
    last_updated_by_name: users.get(Number(i.last_updated_by))?.username || null
  }));
  const total = rows.reduce((acc, r) => acc + r.available_quantity_mt, 0);
  const byType = FUEL_TYPES.map((fuel_type) => ({
    fuel_type,
    available_mt: rows.filter((r) => r.fuel_type === fuel_type).reduce((acc, r) => acc + r.available_quantity_mt, 0),
    allocated_mt: allocated[fuel_type] || 0
  }));
  const byPort = [...new Set(rows.map((r) => r.port))].map((port) => ({
    port,
    available_mt: rows.filter((r) => r.port === port).reduce((acc, r) => acc + r.available_quantity_mt, 0)
  }));
  return {
    rows,
    totals: { available_mt: Math.round(total * 100) / 100 },
    by_type: byType,
    by_port: byPort,
    low_stock: rows.filter((r) => r.is_low),
    allocations: ctx.allocations
  };
}

async function upsertInventory(payload, user, id) {
  const repos = getRepos();
  const qty = num(payload.available_quantity_mt);
  if (qty < 0) throw new HttpError(400, 'Stock cannot be negative');
  if (!payload.port || !payload.fuel_type) throw new HttpError(400, 'Port and fuel type are required');
  if (!FUEL_TYPES.includes(payload.fuel_type)) throw new HttpError(400, 'Invalid fuel type');
  const body = {
    port: payload.port,
    fuel_type: payload.fuel_type,
    available_quantity_mt: qty,
    reorder_level_mt: num(payload.reorder_level_mt),
    last_updated_by: user.user_id,
    last_updated_at: new Date().toISOString()
  };
  if (id) {
    const updated = await repos.inventory.update(id, body);
    if (!updated) throw new HttpError(404, 'Inventory record not found');
    return updated;
  }
  const existing = await repos.inventory.findByPortFuel(payload.port, payload.fuel_type);
  if (existing) throw new HttpError(409, 'Inventory already exists for this port and fuel type');
  return repos.inventory.create(body);
}

async function listAllocations() {
  const ctx = await snapshot();
  const users = userMap(ctx.users);
  return ctx.allocations.map((a) => ({
    ...a,
    quantity_mt: num(a.quantity_mt),
    ship_name: ctx.ships.find((s) => Number(s.ship_id) === Number(a.ship_id))?.ship_name || null,
    allocated_by_name: users.get(Number(a.allocated_by))?.username || null,
    po_number: ctx.purchases.find((p) => Number(p.purchase_id) === Number(a.purchase_id))?.po_number || null
  }));
}

async function saveAllocation(payload, user, id) {
  const repos = getRepos();
  const qty = num(payload.quantity_mt);
  if (!(qty > 0)) throw new HttpError(400, 'Allocation quantity must be greater than zero');
  const ship = await repos.ships.findById(payload.ship_id);
  if (!ship) throw new HttpError(400, 'Ship not found');
  if (!FUEL_TYPES.includes(payload.fuel_type)) throw new HttpError(400, 'Invalid fuel type');

  const stock = await repos.inventory.findByPortFuel(ship.current_port, payload.fuel_type);
  const previous = id ? await repos.allocations.findById(id) : null;
  const previousQty = previous && previous.status !== 'Cancelled' ? num(previous.quantity_mt) : 0;
  const available = stock ? num(stock.available_quantity_mt) + previousQty : previousQty;
  if (payload.status !== 'Cancelled' && qty > available) {
    throw new HttpError(400, `Allocation exceeds available stock at ${ship.current_port} (${available} MT)`);
  }

  const body = {
    ship_id: Number(payload.ship_id),
    fuel_type: payload.fuel_type,
    quantity_mt: qty,
    allocation_date: payload.allocation_date || new Date().toISOString(),
    allocated_by: user.user_id,
    purchase_id: payload.purchase_id || null,
    status: payload.status || 'Planned',
    remarks: payload.remarks || null
  };

  let row;
  if (id) {
    row = await repos.allocations.update(id, body);
    if (!row) throw new HttpError(404, 'Allocation not found');
  } else {
    row = await repos.allocations.create(body);
  }

  if (stock) {
    let nextQty = num(stock.available_quantity_mt) + previousQty;
    if (body.status !== 'Cancelled') nextQty -= qty;
    if (nextQty < 0) throw new HttpError(400, 'Stock cannot be negative');
    await repos.inventory.update(stock.inventory_id, {
      available_quantity_mt: Math.round(nextQty * 100) / 100,
      last_updated_by: user.user_id,
      last_updated_at: new Date().toISOString()
    });
  }
  return row;
}

module.exports = { listInventory, upsertInventory, listAllocations, saveAllocation };
