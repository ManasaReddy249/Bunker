-- BunkerSmart schema reference captured from B3A-S7-T1 on 2026-11-03
-- Source of truth: live SQL Server. This file is documentation only.
-- Application tables (do not recreate):
--   dbo.Users, dbo.Ships, dbo.VendorOffers, dbo.FuelPurchaseRequests,
--   dbo.AdminReviews, dbo.Purchases, dbo.ShipHistory, dbo.FuelInventory, dbo.FuelAllocations
-- Staging / leftover import tables (do not use in the app, do not drop):
--   dbo.[USER], dbo.ADMIN_REVIEW
-- None of the application tables use IDENTITY. Primary keys are supplied by the application.

/*
dbo.Users
  user_id INT PK
  username VARCHAR(100) UNIQUE NOT NULL
  email VARCHAR(150) UNIQUE NOT NULL
  password_hash VARCHAR(255) NOT NULL
  role VARCHAR(40) NOT NULL
  is_active BIT NOT NULL DEFAULT 1

dbo.Ships
  ship_id INT PK
  ship_name VARCHAR(100) NOT NULL
  current_port VARCHAR(100) NOT NULL
  destination VARCHAR(100) NOT NULL
  total_fuel_capacity_mt DECIMAL(12,2) NOT NULL
  ship_status VARCHAR(20) NOT NULL   -- At Sea | At Port

dbo.VendorOffers
  vendor_offer_id INT PK
  vendor_name VARCHAR(100) NOT NULL
  port VARCHAR(100) NOT NULL
  fuel_type VARCHAR(50) NOT NULL     -- IFO 380 | MGO | MDO | LNG
  price_per_mt DECIMAL(12,2) NOT NULL
  available_quantity_mt DECIMAL(12,2) NOT NULL
  delivery_time_hours INT NOT NULL
  status VARCHAR(20) NOT NULL        -- Available | Limited | Unavailable

dbo.FuelPurchaseRequests
  request_id INT PK
  exec_id INT NOT NULL FK -> Users.user_id
  ship_id INT NOT NULL FK -> Ships.ship_id
  vendor_offer_id INT NOT NULL FK -> VendorOffers.vendor_offer_id
  quantity_mt DECIMAL(12,2) NOT NULL
  expected_price_per_mt DECIMAL(12,2) NOT NULL
  request_date DATETIME2 NOT NULL
  expected_delivery_date DATE NOT NULL
  request_status VARCHAR(30) NOT NULL
    -- Draft | Pending | In Review | Vendor Confirmation | Approved | Rejected
  remarks VARCHAR(MAX) NULL

dbo.AdminReviews
  admin_review_id INT PK
  request_id INT NOT NULL UNIQUE FK -> FuelPurchaseRequests.request_id
  admin_id INT NOT NULL FK -> Users.user_id
  ship_total_capacity_mt DECIMAL(12,2) NOT NULL
  current_fuel_onboard_mt DECIMAL(12,2) NOT NULL
  feasibility_status VARCHAR(20) NOT NULL  -- Pending | Feasible | Not Feasible
  vendor_status VARCHAR(20) NOT NULL       -- Pending | Available | Not Available
  confirmed_quantity_mt DECIMAL(12,2) NULL
  confirmed_price_per_mt DECIMAL(12,2) NULL
  confirmed_delivery_time_hours INT NULL
  vendor_checked_at DATETIME2 NULL
  remarks VARCHAR(MAX) NULL

dbo.Purchases
  purchase_id INT PK
  request_id INT NOT NULL UNIQUE FK -> FuelPurchaseRequests.request_id
  final_admin_id INT NOT NULL FK -> Users.user_id
  final_price_per_mt DECIMAL(12,2) NOT NULL
  total_cost DECIMAL(15,2) NOT NULL
  purchase_date DATETIME2 NOT NULL
  status VARCHAR(20) NOT NULL              -- Approved | Rejected
  po_number VARCHAR(50) NOT NULL UNIQUE    -- generated only after approval

dbo.ShipHistory
  history_id INT PK
  ship_id INT NOT NULL FK -> Ships.ship_id
  recorded_date DATETIME2 NOT NULL
  port VARCHAR(100) NOT NULL
  destination VARCHAR(100) NOT NULL
  fuel_onboard_mt DECIMAL(12,2) NOT NULL
  fuel_consumed_mt DECIMAL(12,2) NOT NULL
  remarks VARCHAR(MAX) NULL

dbo.FuelInventory
  inventory_id INT PK
  port VARCHAR(100) NOT NULL
  fuel_type VARCHAR(50) NOT NULL
  available_quantity_mt DECIMAL(12,2) NOT NULL
  reorder_level_mt DECIMAL(12,2) NOT NULL
  last_updated_by INT NOT NULL FK -> Users.user_id
  last_updated_at DATETIME2 NOT NULL
  UNIQUE (port, fuel_type)

dbo.FuelAllocations
  allocation_id INT PK
  ship_id INT NOT NULL FK -> Ships.ship_id
  fuel_type VARCHAR(50) NOT NULL
  quantity_mt DECIMAL(12,2) NOT NULL
  allocation_date DATETIME2 NOT NULL
  allocated_by INT NOT NULL FK -> Users.user_id
  purchase_id INT NULL FK -> Purchases.purchase_id
  status VARCHAR(20) NOT NULL              -- Planned | Completed | Cancelled
  remarks VARCHAR(MAX) NULL
*/
