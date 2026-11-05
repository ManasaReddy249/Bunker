const { getRepos } = require('../repositories');
const HttpError = require('../utils/httpError');
const env = require('../config/env');
const { nearbyVendor, latestHistoryMap, num, fuelAvailability, requiredFuel, userMap } = require('./helpers');
const { sampleNm } = require('../data/sampleNm');
const { FUEL_TYPES } = require('../utils/constants');

async function snapshot() {
  const repos = getRepos();
  const [users, ships, vendors, requests, reviews, purchases, history, inventory, allocations] = await Promise.all([
    repos.users.list(),
    repos.ships.list(),
    repos.vendors.list(),
    repos.requests.list(),
    repos.reviews.list(),
    repos.purchases.list(),
    repos.history.list(),
    repos.inventory.list(),
    repos.allocations.list()
  ]);
  return { users, ships, vendors, requests, reviews, purchases, history, inventory, allocations, histMap: latestHistoryMap(history), usersById: userMap(users) };
}

function enrichShip(ship, ctx) {
  const hist = ctx.histMap.get(ship.ship_id);
  const onboard = hist ? num(hist.fuel_onboard_mt) : 0;
  const nearby = nearbyVendor(ship, ctx.vendors);
  const avail = fuelAvailability(onboard, ship.total_fuel_capacity_mt);
  return {
    ...ship,
    total_fuel_capacity_mt: num(ship.total_fuel_capacity_mt),
    current_fuel_mt: hist ? onboard : null,
    required_fuel_mt: requiredFuel(ship.total_fuel_capacity_mt, onboard),
    fuel_availability_pct: avail.pct,
    fuel_availability_label: hist ? avail.label : 'No reading',
    last_fuel_reading_at: hist ? hist.recorded_date : null,
    ...nearby
  };
}

function enrichRequest(req, ctx) {
  const ship = ctx.ships.find((s) => Number(s.ship_id) === Number(req.ship_id));
  const vendor = ctx.vendors.find((v) => Number(v.vendor_offer_id) === Number(req.vendor_offer_id));
  const exec = ctx.usersById.get(Number(req.exec_id));
  const review = ctx.reviews.find((r) => Number(r.request_id) === Number(req.request_id));
  const purchase = ctx.purchases.find((p) => Number(p.request_id) === Number(req.request_id));
  const approver = review ? ctx.usersById.get(Number(review.admin_id)) : null;
  return {
    ...req,
    quantity_mt: num(req.quantity_mt),
    expected_price_per_mt: num(req.expected_price_per_mt),
    expected_cost: Math.round(num(req.quantity_mt) * num(req.expected_price_per_mt) * 100) / 100,
    ship_name: ship?.ship_name || null,
    current_port: ship?.current_port || null,
    destination: ship?.destination || null,
    vendor_name: vendor?.vendor_name || null,
    port: vendor?.port || null,
    fuel_type: vendor?.fuel_type || null,
    exec_name: exec?.username || null,
    review: review || null,
    purchase: purchase || null,
    approver_name: approver?.username || null,
    po_number: purchase?.po_number || null
  };
}

async function listShips() {
  const ctx = await snapshot();
  return ctx.ships.map((s) => enrichShip(s, ctx));
}

async function getShip(id) {
  const repos = getRepos();
  const ctx = await snapshot();
  const ship = ctx.ships.find((s) => Number(s.ship_id) === Number(id));
  if (!ship) throw new HttpError(404, 'Ship not found');
  const history = (await repos.history.listByShip(id)).sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date));
  return { ...enrichShip(ship, ctx), history };
}

async function saveShip(payload, id) {
  const repos = getRepos();
  if (!payload.ship_name || !payload.current_port || !payload.destination) {
    throw new HttpError(400, 'Ship name, current port and destination are required');
  }
  const currentShip = id ? await repos.ships.findById(id) : null;
  const body = {
    ship_name: payload.ship_name,
    current_port: payload.current_port,
    destination: payload.destination,
    total_fuel_capacity_mt: id && currentShip ? num(currentShip.total_fuel_capacity_mt) : num(payload.total_fuel_capacity_mt),
    ship_status: payload.ship_status || 'At Port'
  };
  const ship = id ? await repos.ships.update(id, body) : await repos.ships.create(body);
  if (!ship) throw new HttpError(404, 'Ship not found');
  if (!id && payload.current_fuel_mt !== undefined && payload.current_fuel_mt !== null && payload.current_fuel_mt !== '') {
    await repos.history.create({
      ship_id: ship.ship_id,
      recorded_date: new Date().toISOString(),
      port: ship.current_port,
      destination: ship.destination,
      fuel_onboard_mt: num(payload.current_fuel_mt),
      fuel_consumed_mt: 0,
      remarks: 'Initial onboard reading'
    });
  }
  return getShip(ship.ship_id);
}

async function listVendors() {
  const repos = getRepos();
  const vendors = await repos.vendors.list();
  return vendors.map((v) => ({
    ...v,
    price_per_mt: num(v.price_per_mt),
    available_quantity_mt: num(v.available_quantity_mt),
    sample_distance_nm: env.demoMode ? sampleNm(v.port) : null,
    sample_distance_note: env.demoMode ? 'Sample distance (demo). Not calculated from live AIS or chart data.' : null
  }));
}

async function vendorComparison(vendorName) {
  const all = await listVendors();
  const names = [...new Set(all.map((v) => v.vendor_name))];
  const selectedName = vendorName || names[0] || null;
  const offers = all.filter((v) => v.vendor_name === selectedName);
  const details = offers[0] || null;
  const fuelOffers = FUEL_TYPES.map((fuel_type) => {
    const candidates = all.filter((offer) => offer.fuel_type === fuel_type);
    candidates.sort((a, b) => {
      const statusRank = (status) => status === 'Available' ? 0 : status === 'Limited' ? 1 : 2;
      return statusRank(a.status) - statusRank(b.status) || num(a.price_per_mt) - num(b.price_per_mt);
    });
    return { fuel_type, ...(candidates[0] || {}) };
  });
  const chart = FUEL_TYPES.map((fuel_type) => {
    const selectedOffer = offers
      .filter((offer) => offer.fuel_type === fuel_type)
      .sort((a, b) => num(a.price_per_mt) - num(b.price_per_mt))[0];
    const marketOffer = fuelOffers.find((offer) => offer.fuel_type === fuel_type);
    return {
      fuel_type,
      selected_price_per_mt: selectedOffer?.price_per_mt ?? null,
      selected_status: selectedOffer?.status ?? null,
      market_best_price_per_mt: marketOffer?.vendor_offer_id ? marketOffer.price_per_mt : null,
      market_best_vendor: marketOffer?.vendor_name ?? null
    };
  });
  return {
    vendor_names: names,
    selected: selectedName,
    details: details
      ? {
          vendor_name: details.vendor_name,
          port: details.port,
          sample_distance_nm: details.sample_distance_nm,
          sample_distance_note: details.sample_distance_note
        }
      : null,
    offers,
    fuel_offers: fuelOffers,
    chart,
    others: names.filter((n) => n !== selectedName).map((name) => {
      const row = all.find((v) => v.vendor_name === name);
      return {
        vendor_name: name,
        port: row?.port,
        sample_distance_nm: row?.sample_distance_nm,
        sample_distance_note: row?.sample_distance_note
      };
    })
  };
}

module.exports = { snapshot, enrichShip, enrichRequest, listShips, getShip, saveShip, listVendors, vendorComparison };
