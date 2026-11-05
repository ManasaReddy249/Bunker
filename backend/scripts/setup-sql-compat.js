const env = require('../config/env');
const { query, closePool } = require('../config/db');

const tables = [
  `IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
   CREATE TABLE dbo.Users (
     user_id INT NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
     username VARCHAR(100) NOT NULL CONSTRAINT UQ_Users_username UNIQUE,
     email VARCHAR(150) NOT NULL CONSTRAINT UQ_Users_email UNIQUE,
     password_hash VARCHAR(255) NOT NULL,
     role VARCHAR(40) NOT NULL,
     is_active BIT NOT NULL CONSTRAINT DF_Users_is_active DEFAULT (1)
   )`,
  `IF OBJECT_ID(N'dbo.Ships', N'U') IS NULL
   CREATE TABLE dbo.Ships (
     ship_id INT NOT NULL CONSTRAINT PK_Ships PRIMARY KEY,
     ship_name VARCHAR(100) NOT NULL,
     current_port VARCHAR(100) NOT NULL,
     destination VARCHAR(100) NOT NULL,
     total_fuel_capacity_mt DECIMAL(12, 2) NOT NULL,
     ship_status VARCHAR(20) NOT NULL
   )`,
  `IF OBJECT_ID(N'dbo.VendorOffers', N'U') IS NULL
   CREATE TABLE dbo.VendorOffers (
     vendor_offer_id INT NOT NULL CONSTRAINT PK_VendorOffers PRIMARY KEY,
     vendor_name VARCHAR(100) NOT NULL,
     port VARCHAR(100) NOT NULL,
     fuel_type VARCHAR(50) NOT NULL,
     price_per_mt DECIMAL(12, 2) NOT NULL,
     available_quantity_mt DECIMAL(12, 2) NOT NULL,
     delivery_time_hours INT NOT NULL,
     status VARCHAR(20) NOT NULL
   )`,
  `IF OBJECT_ID(N'dbo.FuelPurchaseRequests', N'U') IS NULL
   CREATE TABLE dbo.FuelPurchaseRequests (
     request_id INT NOT NULL CONSTRAINT PK_FuelPurchaseRequests PRIMARY KEY,
     exec_id INT NOT NULL,
     ship_id INT NOT NULL,
     vendor_offer_id INT NOT NULL,
     quantity_mt DECIMAL(12, 2) NOT NULL,
     expected_price_per_mt DECIMAL(12, 2) NOT NULL,
     request_date DATETIME2 NOT NULL,
     expected_delivery_date DATE NOT NULL,
     request_status VARCHAR(30) NOT NULL,
     remarks VARCHAR(MAX) NULL,
     CONSTRAINT FK_Requests_User FOREIGN KEY (exec_id) REFERENCES dbo.Users(user_id),
     CONSTRAINT FK_Requests_Ship FOREIGN KEY (ship_id) REFERENCES dbo.Ships(ship_id),
     CONSTRAINT FK_Requests_Vendor FOREIGN KEY (vendor_offer_id) REFERENCES dbo.VendorOffers(vendor_offer_id)
   )`,
  `IF OBJECT_ID(N'dbo.AdminReviews', N'U') IS NULL
   CREATE TABLE dbo.AdminReviews (
     admin_review_id INT NOT NULL CONSTRAINT PK_AdminReviews PRIMARY KEY,
     request_id INT NOT NULL CONSTRAINT UQ_AdminReviews_request UNIQUE,
     admin_id INT NOT NULL,
     ship_total_capacity_mt DECIMAL(12, 2) NOT NULL,
     current_fuel_onboard_mt DECIMAL(12, 2) NOT NULL,
     feasibility_status VARCHAR(20) NOT NULL,
     vendor_status VARCHAR(20) NOT NULL,
     confirmed_quantity_mt DECIMAL(12, 2) NULL,
     confirmed_price_per_mt DECIMAL(12, 2) NULL,
     confirmed_delivery_time_hours INT NULL,
     vendor_checked_at DATETIME2 NULL,
     remarks VARCHAR(MAX) NULL,
     CONSTRAINT FK_AdminReviews_Request FOREIGN KEY (request_id) REFERENCES dbo.FuelPurchaseRequests(request_id),
     CONSTRAINT FK_AdminReviews_User FOREIGN KEY (admin_id) REFERENCES dbo.Users(user_id)
   )`,
  `IF OBJECT_ID(N'dbo.Purchases', N'U') IS NULL
   CREATE TABLE dbo.Purchases (
     purchase_id INT NOT NULL CONSTRAINT PK_Purchases PRIMARY KEY,
     request_id INT NOT NULL CONSTRAINT UQ_Purchases_request UNIQUE,
     final_admin_id INT NOT NULL,
     final_price_per_mt DECIMAL(12, 2) NOT NULL,
     total_cost DECIMAL(15, 2) NOT NULL,
     purchase_date DATETIME2 NOT NULL,
     status VARCHAR(20) NOT NULL,
     po_number VARCHAR(50) NULL,
     CONSTRAINT FK_Purchases_Request FOREIGN KEY (request_id) REFERENCES dbo.FuelPurchaseRequests(request_id),
     CONSTRAINT FK_Purchases_User FOREIGN KEY (final_admin_id) REFERENCES dbo.Users(user_id)
   )`,
  `IF OBJECT_ID(N'dbo.ShipHistory', N'U') IS NULL
   CREATE TABLE dbo.ShipHistory (
     history_id INT NOT NULL CONSTRAINT PK_ShipHistory PRIMARY KEY,
     ship_id INT NOT NULL,
     recorded_date DATETIME2 NOT NULL,
     port VARCHAR(100) NOT NULL,
     destination VARCHAR(100) NOT NULL,
     fuel_onboard_mt DECIMAL(12, 2) NOT NULL,
     fuel_consumed_mt DECIMAL(12, 2) NOT NULL,
     remarks VARCHAR(MAX) NULL,
     CONSTRAINT FK_ShipHistory_Ship FOREIGN KEY (ship_id) REFERENCES dbo.Ships(ship_id)
   )`,
  `IF OBJECT_ID(N'dbo.FuelInventory', N'U') IS NULL
   CREATE TABLE dbo.FuelInventory (
     inventory_id INT NOT NULL CONSTRAINT PK_FuelInventory PRIMARY KEY,
     port VARCHAR(100) NOT NULL,
     fuel_type VARCHAR(50) NOT NULL,
     available_quantity_mt DECIMAL(12, 2) NOT NULL,
     reorder_level_mt DECIMAL(12, 2) NOT NULL,
     last_updated_by INT NOT NULL,
     last_updated_at DATETIME2 NOT NULL,
     CONSTRAINT UQ_FuelInventory_port_fuel UNIQUE (port, fuel_type),
     CONSTRAINT FK_FuelInventory_User FOREIGN KEY (last_updated_by) REFERENCES dbo.Users(user_id)
   )`,
  `IF OBJECT_ID(N'dbo.FuelAllocations', N'U') IS NULL
   CREATE TABLE dbo.FuelAllocations (
     allocation_id INT NOT NULL CONSTRAINT PK_FuelAllocations PRIMARY KEY,
     ship_id INT NOT NULL,
     fuel_type VARCHAR(50) NOT NULL,
     quantity_mt DECIMAL(12, 2) NOT NULL,
     allocation_date DATETIME2 NOT NULL,
     allocated_by INT NOT NULL,
     purchase_id INT NULL,
     status VARCHAR(20) NOT NULL,
     remarks VARCHAR(MAX) NULL,
     CONSTRAINT FK_FuelAllocations_Ship FOREIGN KEY (ship_id) REFERENCES dbo.Ships(ship_id),
     CONSTRAINT FK_FuelAllocations_User FOREIGN KEY (allocated_by) REFERENCES dbo.Users(user_id),
     CONSTRAINT FK_FuelAllocations_Purchase FOREIGN KEY (purchase_id) REFERENCES dbo.Purchases(purchase_id)
   )`
];

const copies = [
  `INSERT INTO dbo.Users (user_id, username, email, password_hash, role, is_active)
   SELECT user_id, username, email, password_hash,
     CASE WHEN role LIKE '%Admin%' THEN 'Administrator'
          WHEN role LIKE '%Manager%' THEN 'Executive'
      ELSE 'Executive' END,
     is_active
   FROM dbo.user_table AS src
   WHERE NOT EXISTS (
     SELECT 1 FROM dbo.Users AS dst
     WHERE dst.user_id=src.user_id OR dst.username=src.username OR dst.email=src.email
   )`,
  `INSERT INTO dbo.Ships (ship_id, ship_name, current_port, destination, total_fuel_capacity_mt, ship_status)
   SELECT ship_id, ship_name, current_port, destination, total_fuel_capacity_mt, ship_status
   FROM dbo.ship AS src WHERE NOT EXISTS (SELECT 1 FROM dbo.Ships AS dst WHERE dst.ship_id=src.ship_id)`,
  `INSERT INTO dbo.VendorOffers (vendor_offer_id, vendor_name, port, fuel_type, price_per_mt, available_quantity_mt, delivery_time_hours, status)
   SELECT vendor_offer_id, vendor_name, port, fuel_type, price_per_mt, available_quantity,
     COALESCE(TRY_CONVERT(INT, LEFT(delivery_time, CHARINDEX(' ', delivery_time + ' ') - 1)), 0), status
   FROM dbo.vendor AS src
   WHERE NOT EXISTS (SELECT 1 FROM dbo.VendorOffers AS dst WHERE dst.vendor_offer_id=src.vendor_offer_id)`,
  `INSERT INTO dbo.FuelPurchaseRequests (request_id, exec_id, ship_id, vendor_offer_id, quantity_mt, expected_price_per_mt, request_date, expected_delivery_date, request_status, remarks)
   SELECT request_id, exec_id, ship_id, vendor_offer_id, quantity, expected_price_per_mt, request_date, expected_delivery_date, request_status, remarks
   FROM dbo.executive AS src
   WHERE NOT EXISTS (SELECT 1 FROM dbo.FuelPurchaseRequests AS dst WHERE dst.request_id=src.request_id)`,
  `INSERT INTO dbo.AdminReviews (admin_review_id, request_id, admin_id, ship_total_capacity_mt, current_fuel_onboard_mt, feasibility_status, vendor_status, confirmed_quantity_mt, confirmed_price_per_mt, confirmed_delivery_time_hours, vendor_checked_at, remarks)
   SELECT admin_review_id, request_id, admin_id, ship_total_capacity_mt, current_fuel_onboard_mt, feasibility_status, vendor_status,
     confirmed_quantity, confirmed_price_per_mt,
     TRY_CONVERT(INT, LEFT(confirmed_delivery_time, CHARINDEX(' ', confirmed_delivery_time + ' ') - 1)),
     vendor_checked_at, remarks
   FROM dbo.admin AS src
   WHERE NOT EXISTS (SELECT 1 FROM dbo.AdminReviews AS dst WHERE dst.admin_review_id=src.admin_review_id)`,
  `INSERT INTO dbo.Purchases (purchase_id, request_id, final_admin_id, final_price_per_mt, total_cost, purchase_date, status, po_number)
   SELECT purchase_id, request_id, final_admin_id, final_price_per_mt, total_cost, purchase_date, status, po_number
   FROM dbo.purchase AS src
   WHERE NOT EXISTS (SELECT 1 FROM dbo.Purchases AS dst WHERE dst.purchase_id=src.purchase_id)`,
  `INSERT INTO dbo.ShipHistory (history_id, ship_id, recorded_date, port, destination, fuel_onboard_mt, fuel_consumed_mt, remarks)
   SELECT history_id, ship_id, recorded_date, current_port, destination, fuel_onboard_mt, fuel_consumed_mt, NULL
   FROM dbo.ship_history AS src
   WHERE NOT EXISTS (SELECT 1 FROM dbo.ShipHistory AS dst WHERE dst.history_id=src.history_id)`
];

async function main() {
  if (env.demoMode) throw new Error('Set DEMO_MODE=false before configuring SQL Server.');

  try {
    for (const statement of tables) await query(statement);
    await query(`
      UPDATE dbo.Users
      SET role='Executive'
      WHERE role IN ('Fuel Planning Executive', 'Inventory Executive', 'Operations Executive')
      UPDATE dbo.Users SET role='Administrator' WHERE role='Admin'
      UPDATE dbo.Users SET role='Executive' WHERE role='Manager'
    `);
    await query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Purchases') AND name=N'UX_Purchases_po')
        CREATE UNIQUE INDEX UX_Purchases_po ON dbo.Purchases(po_number) WHERE po_number IS NOT NULL
    `);
    for (const statement of copies) await query(statement);
    console.log('Canonical app tables are ready; legacy rows were copied by primary key.');
  } finally {
    await closePool();
  }
}

main().catch((error) => {
  console.error('SQL compatibility setup failed:', error.message);
  process.exitCode = 1;
});
