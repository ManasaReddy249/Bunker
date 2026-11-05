const { sampleNm } = require('../data/sampleNm');
const env = require('../config/env');

function num(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function latestHistoryMap(historyRows) {
  const map = new Map();
  for (const row of historyRows) {
    const current = map.get(row.ship_id);
    if (!current || new Date(row.recorded_date) > new Date(current.recorded_date)) {
      map.set(row.ship_id, row);
    }
  }
  return map;
}

function userMap(users) {
  return new Map(users.map((u) => [Number(u.user_id), u]));
}

function nearbyVendor(ship, vendors, { includeSampleNm = env.demoMode } = {}) {
  const matches = vendors.filter((v) => v.port === ship.current_port && String(v.status).toLowerCase() !== 'unavailable');
  if (!matches.length) return { nearby_vendor: null, nearby_vendor_port: null, sample_distance_nm: null };
  const preferred = matches.find((v) => v.status === 'Available') || matches[0];
  return {
    nearby_vendor: preferred.vendor_name,
    nearby_vendor_port: preferred.port,
    nearby_fuel_type: preferred.fuel_type,
    sample_distance_nm: includeSampleNm ? sampleNm(preferred.port) : null,
    sample_distance_note: includeSampleNm ? 'Sample distance (demo). Not calculated from live AIS or chart data.' : null
  };
}

function fuelAvailability(onboard, capacity) {
  if (!capacity) return { pct: 0, label: 'Unknown' };
  const pct = Math.round((num(onboard) / num(capacity)) * 100);
  let label = 'Healthy';
  if (pct < 25) label = 'Critical';
  else if (pct < 40) label = 'Low';
  else if (pct < 60) label = 'Watch';
  return { pct, label };
}

function requiredFuel(capacity, onboard) {
  const need = Math.max(num(capacity) * 0.4 - num(onboard), 0);
  return Math.round(need * 100) / 100;
}

module.exports = { num, latestHistoryMap, userMap, nearbyVendor, fuelAvailability, requiredFuel };
