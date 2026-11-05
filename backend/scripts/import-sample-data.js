const env = require('../config/env');
const { sql, query, closePool } = require('../config/db');
const { loadCsv, toInt, toNum, toNullInt } = require('../utils/csv');

const asDateTime = (value) => value ? new Date(value) : null;
const asText = (value) => value || null;

const datasets = [
  {
    file: 'SHIP.csv', table: 'Ships', key: 'ship_id', fields: [
      ['ship_id', sql.Int, (r) => toInt(r.ship_id)],
      ['ship_name', sql.VarChar(100), (r) => r.ship_name],
      ['current_port', sql.VarChar(100), (r) => r.current_port],
      ['destination', sql.VarChar(100), (r) => r.destination],
      ['total_fuel_capacity_mt', sql.Decimal(12, 2), (r) => toNum(r.total_fuel_capacity_mt)],
      ['ship_status', sql.VarChar(20), (r) => r.ship_status]
    ]
  },
  {
    file: 'VENDOR.csv', table: 'VendorOffers', key: 'vendor_offer_id', fields: [
      ['vendor_offer_id', sql.Int, (r) => toInt(r.vendor_offer_id)],
      ['vendor_name', sql.VarChar(100), (r) => r.vendor_name],
      ['port', sql.VarChar(100), (r) => r.port],
      ['fuel_type', sql.VarChar(50), (r) => r.fuel_type],
      ['price_per_mt', sql.Decimal(12, 2), (r) => toNum(r.price_per_mt)],
      ['available_quantity_mt', sql.Decimal(12, 2), (r) => toNum(r.available_quantity_mt)],
      ['delivery_time_hours', sql.Int, (r) => toInt(r.delivery_time_hours)],
      ['status', sql.VarChar(20), (r) => r.status]
    ]
  },
  {
    file: 'EXECUTIVE_REQUEST.csv', table: 'FuelPurchaseRequests', key: 'request_id', fields: [
      ['request_id', sql.Int, (r) => toInt(r.request_id)],
      ['exec_id', sql.Int, (r) => toInt(r.exec_id)],
      ['ship_id', sql.Int, (r) => toInt(r.ship_id)],
      ['vendor_offer_id', sql.Int, (r) => toInt(r.vendor_offer_id)],
      ['quantity_mt', sql.Decimal(12, 2), (r) => toNum(r.quantity_mt)],
      ['expected_price_per_mt', sql.Decimal(12, 2), (r) => toNum(r.expected_price_per_mt)],
      ['request_date', sql.DateTime2, (r) => asDateTime(r.request_date)],
      ['expected_delivery_date', sql.Date, (r) => asDateTime(r.expected_delivery_date)],
      ['request_status', sql.VarChar(30), (r) => r.request_status],
      ['remarks', sql.VarChar(sql.MAX), (r) => asText(r.remarks)]
    ]
  },
  {
    file: 'ADMIN_REVIEW.csv', table: 'AdminReviews', key: 'admin_review_id', fields: [
      ['admin_review_id', sql.Int, (r) => toInt(r.admin_review_id)],
      ['request_id', sql.Int, (r) => toInt(r.request_id)],
      ['admin_id', sql.Int, (r) => toInt(r.admin_id)],
      ['ship_total_capacity_mt', sql.Decimal(12, 2), (r) => toNum(r.ship_total_capacity_mt)],
      ['current_fuel_onboard_mt', sql.Decimal(12, 2), (r) => toNum(r.current_fuel_onboard_mt)],
      ['feasibility_status', sql.VarChar(20), (r) => r.feasibility_status],
      ['vendor_status', sql.VarChar(20), (r) => r.vendor_status],
      ['confirmed_quantity_mt', sql.Decimal(12, 2), (r) => toNum(r.confirmed_quantity_mt)],
      ['confirmed_price_per_mt', sql.Decimal(12, 2), (r) => toNum(r.confirmed_price_per_mt)],
      ['confirmed_delivery_time_hours', sql.Int, (r) => toNullInt(r.confirmed_delivery_time_hours)],
      ['vendor_checked_at', sql.DateTime2, (r) => asDateTime(r.vendor_checked_at)],
      ['remarks', sql.VarChar(sql.MAX), (r) => asText(r.remarks)]
    ]
  },
  {
    file: 'PURCHASE.csv', table: 'Purchases', key: 'purchase_id', fields: [
      ['purchase_id', sql.Int, (r) => toInt(r.purchase_id)],
      ['request_id', sql.Int, (r) => toInt(r.request_id)],
      ['final_admin_id', sql.Int, (r) => toInt(r.final_admin_id)],
      ['final_price_per_mt', sql.Decimal(12, 2), (r) => toNum(r.final_price_per_mt)],
      ['total_cost', sql.Decimal(15, 2), (r) => toNum(r.total_cost)],
      ['purchase_date', sql.DateTime2, (r) => asDateTime(r.purchase_date)],
      ['status', sql.VarChar(20), (r) => r.status],
      ['po_number', sql.VarChar(50), (r) => r.po_number]
    ]
  },
  {
    file: 'SHIP_HISTORY.csv', table: 'ShipHistory', key: 'history_id', fields: [
      ['history_id', sql.Int, (r) => toInt(r.history_id)],
      ['ship_id', sql.Int, (r) => toInt(r.ship_id)],
      ['recorded_date', sql.DateTime2, (r) => asDateTime(r.recorded_date)],
      ['port', sql.VarChar(100), (r) => r.port],
      ['destination', sql.VarChar(100), (r) => r.destination],
      ['fuel_onboard_mt', sql.Decimal(12, 2), (r) => toNum(r.fuel_onboard_mt)],
      ['fuel_consumed_mt', sql.Decimal(12, 2), (r) => toNum(r.fuel_consumed_mt)],
      ['remarks', sql.VarChar(sql.MAX), (r) => asText(r.remarks)]
    ]
  },
  {
    file: 'FUEL_INVENTORY.csv', table: 'FuelInventory', key: 'inventory_id', fields: [
      ['inventory_id', sql.Int, (r) => toInt(r.inventory_id)],
      ['port', sql.VarChar(100), (r) => r.port],
      ['fuel_type', sql.VarChar(50), (r) => r.fuel_type],
      ['available_quantity_mt', sql.Decimal(12, 2), (r) => toNum(r.available_quantity_mt)],
      ['reorder_level_mt', sql.Decimal(12, 2), (r) => toNum(r.reorder_level_mt)],
      ['last_updated_by', sql.Int, (r) => toInt(r.last_updated_by)],
      ['last_updated_at', sql.DateTime2, (r) => asDateTime(r.last_updated_at)]
    ]
  },
  {
    file: 'FUEL_ALLOCATIONS.csv', table: 'FuelAllocations', key: 'allocation_id', fields: [
      ['allocation_id', sql.Int, (r) => toInt(r.allocation_id)],
      ['ship_id', sql.Int, (r) => toInt(r.ship_id)],
      ['fuel_type', sql.VarChar(50), (r) => r.fuel_type],
      ['quantity_mt', sql.Decimal(12, 2), (r) => toNum(r.quantity_mt)],
      ['allocation_date', sql.DateTime2, (r) => asDateTime(r.allocation_date)],
      ['allocated_by', sql.Int, (r) => toInt(r.allocated_by)],
      ['purchase_id', sql.Int, (r) => toNullInt(r.purchase_id)],
      ['status', sql.VarChar(20), (r) => r.status],
      ['remarks', sql.VarChar(sql.MAX), (r) => asText(r.remarks)]
    ]
  }
];

async function insertIfMissing(dataset, row) {
  const columns = dataset.fields.map(([name]) => name);
  const inputs = dataset.fields.map(([name, type, getValue]) => ({
    name,
    type,
    value: getValue(row)
  }));
  const placeholders = columns.map((name) => `@${name}`);
  await query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.${dataset.table} WHERE ${dataset.key}=@${dataset.key})
      INSERT INTO dbo.${dataset.table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
  `, inputs);
}

async function main() {
  if (env.demoMode) throw new Error('Set DEMO_MODE=false before importing sample data.');

  try {
    for (const dataset of datasets) {
      const rows = loadCsv(dataset.file);
      for (const row of rows) await insertIfMissing(dataset, row);
      console.log(`${dataset.file}: processed ${rows.length} rows`);
    }
    console.log('Skipped USER.csv because its password hashes are placeholders.');
  } finally {
    await closePool();
  }
}

main().catch((error) => {
  console.error('Sample data import failed:', error.message);
  process.exitCode = 1;
});