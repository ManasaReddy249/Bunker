const { sql, query } = require('../../config/db');
const { ID_START } = require('../../utils/constants');

async function nextNumericId(table, column, fallbackStart) {
  const result = await query(
    `SELECT ISNULL(MAX(${column}), ${fallbackStart - 1}) + 1 AS next_id FROM ${table}`
  );
  return result.recordset[0].next_id;
}

const sqlRepos = {
  mode: 'sql',

  users: {
    async findByLogin(login) {
      const result = await query(
        'SELECT * FROM dbo.Users WHERE username = @login OR email = @login',
        [{ name: 'login', type: sql.NVarChar(150), value: login }]
      );
      return result.recordset[0] || null;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.Users WHERE user_id = @id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async list() {
      const result = await query('SELECT * FROM dbo.Users ORDER BY user_id');
      return result.recordset;
    },
    async create(row) {
      const userId = row.user_id || (await nextNumericId('dbo.Users', 'user_id', ID_START.users));
      await query(
        `INSERT INTO dbo.Users (user_id, username, email, password_hash, role, is_active)
         VALUES (@user_id, @username, @email, @password_hash, @role, @is_active)`,
        [
          { name: 'user_id', type: sql.Int, value: userId },
          { name: 'username', type: sql.VarChar(100), value: row.username },
          { name: 'email', type: sql.VarChar(150), value: row.email },
          { name: 'password_hash', type: sql.VarChar(255), value: row.password_hash },
          { name: 'role', type: sql.VarChar(40), value: row.role },
          { name: 'is_active', type: sql.Bit, value: row.is_active ? 1 : 0 }
        ]
      );
      return this.findById(userId);
    },
    async update(id, patch) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.Users SET username=@username, email=@email, password_hash=@password_hash, role=@role, is_active=@is_active
         WHERE user_id=@id`,
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'username', type: sql.VarChar(100), value: next.username },
          { name: 'email', type: sql.VarChar(150), value: next.email },
          { name: 'password_hash', type: sql.VarChar(255), value: next.password_hash },
          { name: 'role', type: sql.VarChar(40), value: next.role },
          { name: 'is_active', type: sql.Bit, value: next.is_active ? 1 : 0 }
        ]
      );
      return this.findById(id);
    }
  },

  ships: {
    async list() {
      const result = await query('SELECT * FROM dbo.Ships ORDER BY ship_id');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.Ships WHERE ship_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.ship_id || (await nextNumericId('dbo.Ships', 'ship_id', ID_START.ships));
      await query(
        `INSERT INTO dbo.Ships (ship_id, ship_name, current_port, destination, total_fuel_capacity_mt, ship_status)
         VALUES (@ship_id, @ship_name, @current_port, @destination, @total_fuel_capacity_mt, @ship_status)`,
        [
          { name: 'ship_id', type: sql.Int, value: id },
          { name: 'ship_name', type: sql.VarChar(100), value: row.ship_name },
          { name: 'current_port', type: sql.VarChar(100), value: row.current_port },
          { name: 'destination', type: sql.VarChar(100), value: row.destination },
          { name: 'total_fuel_capacity_mt', type: sql.Decimal(12, 2), value: row.total_fuel_capacity_mt },
          { name: 'ship_status', type: sql.VarChar(20), value: row.ship_status }
        ]
      );
      return this.findById(id);
    },
    async update(id, patch) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.Ships SET ship_name=@ship_name, current_port=@current_port, destination=@destination,
         total_fuel_capacity_mt=@total_fuel_capacity_mt, ship_status=@ship_status WHERE ship_id=@id`,
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'ship_name', type: sql.VarChar(100), value: next.ship_name },
          { name: 'current_port', type: sql.VarChar(100), value: next.current_port },
          { name: 'destination', type: sql.VarChar(100), value: next.destination },
          { name: 'total_fuel_capacity_mt', type: sql.Decimal(12, 2), value: next.total_fuel_capacity_mt },
          { name: 'ship_status', type: sql.VarChar(20), value: next.ship_status }
        ]
      );
      return this.findById(id);
    }
  },

  vendors: {
    async list() {
      const result = await query('SELECT * FROM dbo.VendorOffers ORDER BY vendor_name, fuel_type');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.VendorOffers WHERE vendor_offer_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    }
  },

  requests: {
    async list() {
      const result = await query('SELECT * FROM dbo.FuelPurchaseRequests ORDER BY request_date DESC');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.FuelPurchaseRequests WHERE request_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.request_id || (await nextNumericId('dbo.FuelPurchaseRequests', 'request_id', ID_START.requests));
      await query(
        `INSERT INTO dbo.FuelPurchaseRequests
          (request_id, exec_id, ship_id, vendor_offer_id, quantity_mt, expected_price_per_mt, request_date, expected_delivery_date, request_status, remarks)
         VALUES
          (@request_id, @exec_id, @ship_id, @vendor_offer_id, @quantity_mt, @expected_price_per_mt, @request_date, @expected_delivery_date, @request_status, @remarks)`,
        [
          { name: 'request_id', type: sql.Int, value: id },
          { name: 'exec_id', type: sql.Int, value: row.exec_id },
          { name: 'ship_id', type: sql.Int, value: row.ship_id },
          { name: 'vendor_offer_id', type: sql.Int, value: row.vendor_offer_id },
          { name: 'quantity_mt', type: sql.Decimal(12, 2), value: row.quantity_mt },
          { name: 'expected_price_per_mt', type: sql.Decimal(12, 2), value: row.expected_price_per_mt },
          { name: 'request_date', type: sql.DateTime2, value: new Date(row.request_date) },
          { name: 'expected_delivery_date', type: sql.Date, value: row.expected_delivery_date },
          { name: 'request_status', type: sql.VarChar(30), value: row.request_status },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: row.remarks || null }
        ]
      );
      return this.findById(id);
    },
    async update(id, patch) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.FuelPurchaseRequests SET exec_id=@exec_id, ship_id=@ship_id, vendor_offer_id=@vendor_offer_id,
         quantity_mt=@quantity_mt, expected_price_per_mt=@expected_price_per_mt, request_date=@request_date,
         expected_delivery_date=@expected_delivery_date, request_status=@request_status, remarks=@remarks
         WHERE request_id=@id`,
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'exec_id', type: sql.Int, value: next.exec_id },
          { name: 'ship_id', type: sql.Int, value: next.ship_id },
          { name: 'vendor_offer_id', type: sql.Int, value: next.vendor_offer_id },
          { name: 'quantity_mt', type: sql.Decimal(12, 2), value: next.quantity_mt },
          { name: 'expected_price_per_mt', type: sql.Decimal(12, 2), value: next.expected_price_per_mt },
          { name: 'request_date', type: sql.DateTime2, value: new Date(next.request_date) },
          { name: 'expected_delivery_date', type: sql.Date, value: next.expected_delivery_date },
          { name: 'request_status', type: sql.VarChar(30), value: next.request_status },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: next.remarks || null }
        ]
      );
      return this.findById(id);
    }
  },

  reviews: {
    async list() {
      const result = await query('SELECT * FROM dbo.AdminReviews ORDER BY admin_review_id');
      return result.recordset;
    },
    async findByRequestId(requestId) {
      const result = await query('SELECT * FROM dbo.AdminReviews WHERE request_id=@id', [
        { name: 'id', type: sql.Int, value: requestId }
      ]);
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.admin_review_id || (await nextNumericId('dbo.AdminReviews', 'admin_review_id', ID_START.reviews));
      await query(
        `INSERT INTO dbo.AdminReviews
          (admin_review_id, request_id, admin_id, ship_total_capacity_mt, current_fuel_onboard_mt, feasibility_status, vendor_status,
           confirmed_quantity_mt, confirmed_price_per_mt, confirmed_delivery_time_hours, vendor_checked_at, remarks)
         VALUES
          (@admin_review_id, @request_id, @admin_id, @ship_total_capacity_mt, @current_fuel_onboard_mt, @feasibility_status, @vendor_status,
           @confirmed_quantity_mt, @confirmed_price_per_mt, @confirmed_delivery_time_hours, @vendor_checked_at, @remarks)`,
        [
          { name: 'admin_review_id', type: sql.Int, value: id },
          { name: 'request_id', type: sql.Int, value: row.request_id },
          { name: 'admin_id', type: sql.Int, value: row.admin_id },
          { name: 'ship_total_capacity_mt', type: sql.Decimal(12, 2), value: row.ship_total_capacity_mt },
          { name: 'current_fuel_onboard_mt', type: sql.Decimal(12, 2), value: row.current_fuel_onboard_mt },
          { name: 'feasibility_status', type: sql.VarChar(20), value: row.feasibility_status },
          { name: 'vendor_status', type: sql.VarChar(20), value: row.vendor_status },
          { name: 'confirmed_quantity_mt', type: sql.Decimal(12, 2), value: row.confirmed_quantity_mt },
          { name: 'confirmed_price_per_mt', type: sql.Decimal(12, 2), value: row.confirmed_price_per_mt },
          { name: 'confirmed_delivery_time_hours', type: sql.Int, value: row.confirmed_delivery_time_hours },
          { name: 'vendor_checked_at', type: sql.DateTime2, value: row.vendor_checked_at ? new Date(row.vendor_checked_at) : null },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: row.remarks || null }
        ]
      );
      return this.findByRequestId(row.request_id);
    },
    async updateByRequestId(requestId, patch) {
      const current = await this.findByRequestId(requestId);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.AdminReviews SET admin_id=@admin_id, ship_total_capacity_mt=@ship_total_capacity_mt,
         current_fuel_onboard_mt=@current_fuel_onboard_mt, feasibility_status=@feasibility_status, vendor_status=@vendor_status,
         confirmed_quantity_mt=@confirmed_quantity_mt, confirmed_price_per_mt=@confirmed_price_per_mt,
         confirmed_delivery_time_hours=@confirmed_delivery_time_hours, vendor_checked_at=@vendor_checked_at, remarks=@remarks
         WHERE request_id=@request_id`,
        [
          { name: 'request_id', type: sql.Int, value: requestId },
          { name: 'admin_id', type: sql.Int, value: next.admin_id },
          { name: 'ship_total_capacity_mt', type: sql.Decimal(12, 2), value: next.ship_total_capacity_mt },
          { name: 'current_fuel_onboard_mt', type: sql.Decimal(12, 2), value: next.current_fuel_onboard_mt },
          { name: 'feasibility_status', type: sql.VarChar(20), value: next.feasibility_status },
          { name: 'vendor_status', type: sql.VarChar(20), value: next.vendor_status },
          { name: 'confirmed_quantity_mt', type: sql.Decimal(12, 2), value: next.confirmed_quantity_mt },
          { name: 'confirmed_price_per_mt', type: sql.Decimal(12, 2), value: next.confirmed_price_per_mt },
          { name: 'confirmed_delivery_time_hours', type: sql.Int, value: next.confirmed_delivery_time_hours },
          { name: 'vendor_checked_at', type: sql.DateTime2, value: next.vendor_checked_at ? new Date(next.vendor_checked_at) : null },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: next.remarks || null }
        ]
      );
      return this.findByRequestId(requestId);
    }
  },

  purchases: {
    async list() {
      const result = await query('SELECT * FROM dbo.Purchases ORDER BY purchase_date DESC');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.Purchases WHERE purchase_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async findByRequestId(requestId) {
      const result = await query('SELECT * FROM dbo.Purchases WHERE request_id=@id', [
        { name: 'id', type: sql.Int, value: requestId }
      ]);
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.purchase_id || (await nextNumericId('dbo.Purchases', 'purchase_id', ID_START.purchases));
      await query(
        `INSERT INTO dbo.Purchases
          (purchase_id, request_id, final_admin_id, final_price_per_mt, total_cost, purchase_date, status, po_number)
         VALUES
          (@purchase_id, @request_id, @final_admin_id, @final_price_per_mt, @total_cost, @purchase_date, @status, @po_number)`,
        [
          { name: 'purchase_id', type: sql.Int, value: id },
          { name: 'request_id', type: sql.Int, value: row.request_id },
          { name: 'final_admin_id', type: sql.Int, value: row.final_admin_id },
          { name: 'final_price_per_mt', type: sql.Decimal(12, 2), value: row.final_price_per_mt },
          { name: 'total_cost', type: sql.Decimal(15, 2), value: row.total_cost },
          { name: 'purchase_date', type: sql.DateTime2, value: new Date(row.purchase_date) },
          { name: 'status', type: sql.VarChar(20), value: row.status },
          { name: 'po_number', type: sql.VarChar(50), value: row.po_number }
        ]
      );
      return this.findById(id);
    }
  },

  history: {
    async list() {
      const result = await query('SELECT * FROM dbo.ShipHistory ORDER BY recorded_date DESC');
      return result.recordset;
    },
    async listByShip(shipId) {
      const result = await query(
        'SELECT * FROM dbo.ShipHistory WHERE ship_id=@id ORDER BY recorded_date DESC',
        [{ name: 'id', type: sql.Int, value: shipId }]
      );
      return result.recordset;
    },
    async create(row) {
      const id = row.history_id || (await nextNumericId('dbo.ShipHistory', 'history_id', ID_START.history));
      await query(
        `INSERT INTO dbo.ShipHistory
          (history_id, ship_id, recorded_date, port, destination, fuel_onboard_mt, fuel_consumed_mt, remarks)
         VALUES
          (@history_id, @ship_id, @recorded_date, @port, @destination, @fuel_onboard_mt, @fuel_consumed_mt, @remarks)`,
        [
          { name: 'history_id', type: sql.Int, value: id },
          { name: 'ship_id', type: sql.Int, value: row.ship_id },
          { name: 'recorded_date', type: sql.DateTime2, value: new Date(row.recorded_date) },
          { name: 'port', type: sql.VarChar(100), value: row.port },
          { name: 'destination', type: sql.VarChar(100), value: row.destination },
          { name: 'fuel_onboard_mt', type: sql.Decimal(12, 2), value: row.fuel_onboard_mt },
          { name: 'fuel_consumed_mt', type: sql.Decimal(12, 2), value: row.fuel_consumed_mt },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: row.remarks || null }
        ]
      );
      const result = await query('SELECT * FROM dbo.ShipHistory WHERE history_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0];
    }
  },

  inventory: {
    async list() {
      const result = await query('SELECT * FROM dbo.FuelInventory ORDER BY port, fuel_type');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.FuelInventory WHERE inventory_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async findByPortFuel(port, fuelType) {
      const result = await query(
        'SELECT * FROM dbo.FuelInventory WHERE port=@port AND fuel_type=@fuel_type',
        [
          { name: 'port', type: sql.VarChar(100), value: port },
          { name: 'fuel_type', type: sql.VarChar(50), value: fuelType }
        ]
      );
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.inventory_id || (await nextNumericId('dbo.FuelInventory', 'inventory_id', ID_START.inventory));
      await query(
        `INSERT INTO dbo.FuelInventory
          (inventory_id, port, fuel_type, available_quantity_mt, reorder_level_mt, last_updated_by, last_updated_at)
         VALUES
          (@inventory_id, @port, @fuel_type, @available_quantity_mt, @reorder_level_mt, @last_updated_by, @last_updated_at)`,
        [
          { name: 'inventory_id', type: sql.Int, value: id },
          { name: 'port', type: sql.VarChar(100), value: row.port },
          { name: 'fuel_type', type: sql.VarChar(50), value: row.fuel_type },
          { name: 'available_quantity_mt', type: sql.Decimal(12, 2), value: row.available_quantity_mt },
          { name: 'reorder_level_mt', type: sql.Decimal(12, 2), value: row.reorder_level_mt },
          { name: 'last_updated_by', type: sql.Int, value: row.last_updated_by },
          { name: 'last_updated_at', type: sql.DateTime2, value: new Date(row.last_updated_at) }
        ]
      );
      return this.findById(id);
    },
    async update(id, patch) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.FuelInventory SET port=@port, fuel_type=@fuel_type, available_quantity_mt=@available_quantity_mt,
         reorder_level_mt=@reorder_level_mt, last_updated_by=@last_updated_by, last_updated_at=@last_updated_at
         WHERE inventory_id=@id`,
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'port', type: sql.VarChar(100), value: next.port },
          { name: 'fuel_type', type: sql.VarChar(50), value: next.fuel_type },
          { name: 'available_quantity_mt', type: sql.Decimal(12, 2), value: next.available_quantity_mt },
          { name: 'reorder_level_mt', type: sql.Decimal(12, 2), value: next.reorder_level_mt },
          { name: 'last_updated_by', type: sql.Int, value: next.last_updated_by },
          { name: 'last_updated_at', type: sql.DateTime2, value: new Date(next.last_updated_at) }
        ]
      );
      return this.findById(id);
    }
  },

  allocations: {
    async list() {
      const result = await query('SELECT * FROM dbo.FuelAllocations ORDER BY allocation_date DESC');
      return result.recordset;
    },
    async findById(id) {
      const result = await query('SELECT * FROM dbo.FuelAllocations WHERE allocation_id=@id', [
        { name: 'id', type: sql.Int, value: id }
      ]);
      return result.recordset[0] || null;
    },
    async create(row) {
      const id = row.allocation_id || (await nextNumericId('dbo.FuelAllocations', 'allocation_id', ID_START.allocations));
      await query(
        `INSERT INTO dbo.FuelAllocations
          (allocation_id, ship_id, fuel_type, quantity_mt, allocation_date, allocated_by, purchase_id, status, remarks)
         VALUES
          (@allocation_id, @ship_id, @fuel_type, @quantity_mt, @allocation_date, @allocated_by, @purchase_id, @status, @remarks)`,
        [
          { name: 'allocation_id', type: sql.Int, value: id },
          { name: 'ship_id', type: sql.Int, value: row.ship_id },
          { name: 'fuel_type', type: sql.VarChar(50), value: row.fuel_type },
          { name: 'quantity_mt', type: sql.Decimal(12, 2), value: row.quantity_mt },
          { name: 'allocation_date', type: sql.DateTime2, value: new Date(row.allocation_date) },
          { name: 'allocated_by', type: sql.Int, value: row.allocated_by },
          { name: 'purchase_id', type: sql.Int, value: row.purchase_id || null },
          { name: 'status', type: sql.VarChar(20), value: row.status },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: row.remarks || null }
        ]
      );
      return this.findById(id);
    },
    async update(id, patch) {
      const current = await this.findById(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      await query(
        `UPDATE dbo.FuelAllocations SET ship_id=@ship_id, fuel_type=@fuel_type, quantity_mt=@quantity_mt,
         allocation_date=@allocation_date, allocated_by=@allocated_by, purchase_id=@purchase_id, status=@status, remarks=@remarks
         WHERE allocation_id=@id`,
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'ship_id', type: sql.Int, value: next.ship_id },
          { name: 'fuel_type', type: sql.VarChar(50), value: next.fuel_type },
          { name: 'quantity_mt', type: sql.Decimal(12, 2), value: next.quantity_mt },
          { name: 'allocation_date', type: sql.DateTime2, value: new Date(next.allocation_date) },
          { name: 'allocated_by', type: sql.Int, value: next.allocated_by },
          { name: 'purchase_id', type: sql.Int, value: next.purchase_id || null },
          { name: 'status', type: sql.VarChar(20), value: next.status },
          { name: 'remarks', type: sql.VarChar(sql.MAX), value: next.remarks || null }
        ]
      );
      return this.findById(id);
    }
  },

  nextNumericId
};

module.exports = sqlRepos;
