const bcrypt = require('bcryptjs');
const { loadCsv, toInt, toNum, toBool, toNullInt } = require('../../utils/csv');
const { DEMO_ACCOUNTS } = require('../../data/demoAccounts');

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function appRole(role) {
  const value = String(role).toLowerCase();
  if (value.includes('user admin')) return 'User Administrator';
  if (value.includes('admin')) return 'Administrator';
  return 'Executive';
}

function loadStore() {
  const csvUsers = loadCsv('USER.csv').map((r) => ({
    user_id: toInt(r.user_id),
    username: r.username,
    email: r.email,
    password_hash: r.password_hash,
    role: appRole(r.role),
    is_active: toBool(r.is_active),
    imported: true
  }));

  const demoUsers = DEMO_ACCOUNTS.map((a) => ({
    user_id: a.user_id,
    username: a.username,
    email: a.email,
    password_hash: bcrypt.hashSync(a.password, 10),
    role: a.role,
    is_active: true,
    imported: false,
    demo_account: true
  }));

  return {
    users: [...csvUsers, ...demoUsers],
    ships: loadCsv('SHIP.csv').map((r) => ({
      ship_id: toInt(r.ship_id),
      ship_name: r.ship_name,
      current_port: r.current_port,
      destination: r.destination,
      total_fuel_capacity_mt: toNum(r.total_fuel_capacity_mt),
      ship_status: r.ship_status
    })),
    vendorOffers: loadCsv('VENDOR.csv').map((r) => ({
      vendor_offer_id: toInt(r.vendor_offer_id),
      vendor_name: r.vendor_name,
      port: r.port,
      fuel_type: r.fuel_type,
      price_per_mt: toNum(r.price_per_mt),
      available_quantity_mt: toNum(r.available_quantity_mt),
      delivery_time_hours: toInt(r.delivery_time_hours),
      status: r.status
    })),
    requests: loadCsv('EXECUTIVE_REQUEST.csv').map((r) => ({
      request_id: toInt(r.request_id),
      exec_id: toInt(r.exec_id),
      ship_id: toInt(r.ship_id),
      vendor_offer_id: toInt(r.vendor_offer_id),
      quantity_mt: toNum(r.quantity_mt),
      expected_price_per_mt: toNum(r.expected_price_per_mt),
      request_date: r.request_date,
      expected_delivery_date: String(r.expected_delivery_date).slice(0, 10),
      request_status: r.request_status,
      remarks: r.remarks || null
    })),
    reviews: loadCsv('ADMIN_REVIEW.csv').map((r) => ({
      admin_review_id: toInt(r.admin_review_id),
      request_id: toInt(r.request_id),
      admin_id: toInt(r.admin_id),
      ship_total_capacity_mt: toNum(r.ship_total_capacity_mt),
      current_fuel_onboard_mt: toNum(r.current_fuel_onboard_mt),
      feasibility_status: r.feasibility_status,
      vendor_status: r.vendor_status,
      confirmed_quantity_mt: r.confirmed_quantity_mt === '' ? null : toNum(r.confirmed_quantity_mt),
      confirmed_price_per_mt: r.confirmed_price_per_mt === '' ? null : toNum(r.confirmed_price_per_mt),
      confirmed_delivery_time_hours: toNullInt(r.confirmed_delivery_time_hours),
      vendor_checked_at: r.vendor_checked_at || null,
      remarks: r.remarks || null
    })),
    purchases: loadCsv('PURCHASE.csv').map((r) => ({
      purchase_id: toInt(r.purchase_id),
      request_id: toInt(r.request_id),
      final_admin_id: toInt(r.final_admin_id),
      final_price_per_mt: toNum(r.final_price_per_mt),
      total_cost: toNum(r.total_cost),
      purchase_date: r.purchase_date,
      status: r.status,
      po_number: r.po_number
    })),
    shipHistory: loadCsv('SHIP_HISTORY.csv').map((r) => ({
      history_id: toInt(r.history_id),
      ship_id: toInt(r.ship_id),
      recorded_date: r.recorded_date,
      port: r.port,
      destination: r.destination,
      fuel_onboard_mt: toNum(r.fuel_onboard_mt),
      fuel_consumed_mt: toNum(r.fuel_consumed_mt),
      remarks: r.remarks || null
    })),
    inventory: loadCsv('FUEL_INVENTORY.csv').map((r) => ({
      inventory_id: toInt(r.inventory_id),
      port: r.port,
      fuel_type: r.fuel_type,
      available_quantity_mt: toNum(r.available_quantity_mt),
      reorder_level_mt: toNum(r.reorder_level_mt),
      last_updated_by: toInt(r.last_updated_by),
      last_updated_at: r.last_updated_at
    })),
    allocations: loadCsv('FUEL_ALLOCATIONS.csv').map((r) => ({
      allocation_id: toInt(r.allocation_id),
      ship_id: toInt(r.ship_id),
      fuel_type: r.fuel_type,
      quantity_mt: toNum(r.quantity_mt),
      allocation_date: r.allocation_date,
      allocated_by: toInt(r.allocated_by),
      purchase_id: toNullInt(r.purchase_id),
      status: r.status,
      remarks: r.remarks || null
    }))
  };
}

const store = loadStore();

module.exports = { store, clone, reload: loadStore };
