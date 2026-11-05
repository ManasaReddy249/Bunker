const env = require('../config/env');
const { snapshot, enrichShip } = require('./catalogService');
const { num } = require('./helpers');

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function planning() {
  const ctx = await snapshot();
  const ships = ctx.ships.map((s) => enrichShip(s, ctx));
  const byShip = ships.map((s) => {
    const hist = ctx.history.filter((h) => Number(h.ship_id) === Number(s.ship_id));
    const consumed = hist.reduce((acc, h) => acc + num(h.fuel_consumed_mt), 0);
    return {
      ...s,
      historical_consumption_mt: Math.round(consumed * 100) / 100,
      readings: hist.length,
      shortage: s.fuel_availability_label === 'Critical' || s.fuel_availability_label === 'Low'
    };
  });
  const trend = {};
  for (const h of ctx.history) {
    const key = monthKey(h.recorded_date);
    if (!key) continue;
    trend[key] = (trend[key] || 0) + num(h.fuel_consumed_mt);
  }
  const shortages = byShip.filter((s) => s.shortage);
  const recommendations = shortages.map((s) => ({
    ship_name: s.ship_name,
    current_fuel_mt: s.current_fuel_mt,
    required_fuel_mt: s.required_fuel_mt,
    nearby_vendor: s.nearby_vendor,
    note: 'Reorder recommendation based on onboard reading vs 40% of capacity. Not an operational forecast.'
  }));
  return {
    demo_mode: env.demoMode,
    disclaimer: 'Historical consumption is taken from ShipHistory. Figures labelled as recommendations are not forecasts.',
    ships: byShip,
    monthly_trend: Object.keys(trend).sort().map((k) => ({ month: k, mt: Math.round(trend[k] * 100) / 100 })),
    shortages,
    recommendations,
    summaries: {
      total_consumed_mt: Math.round(ctx.history.reduce((acc, h) => acc + num(h.fuel_consumed_mt), 0) * 100) / 100,
      ships_with_shortage: shortages.length,
      ships_tracked: ships.length
    }
  };
}

module.exports = { planning };
