# BunkerSmart schema mapping

Inspected on 2026-11-03: `INBAAVVMMARSSQL` / `B3A-S7-T1`.

## Current source tables

| Source table | App table | Mapping notes |
| --- | --- | --- |
| dbo.user_table | dbo.Users | `Admin` and `Executive` roles map to app role names; source rows are preserved. |
| dbo.ship | dbo.Ships | Columns map directly. |
| dbo.vendor | dbo.VendorOffers | `available_quantity` → `available_quantity_mt`; parse `delivery_time` to hours. |
| dbo.executive | dbo.FuelPurchaseRequests | `quantity` → `quantity_mt`. |
| dbo.admin | dbo.AdminReviews | `confirmed_quantity` → `confirmed_quantity_mt`; parse delivery-time text to hours. |
| dbo.purchase | dbo.Purchases | Columns map directly. |
| dbo.ship_history | dbo.ShipHistory | `current_port` → `port`; other unused legacy columns remain in the source. |
| CSV/FUEL_INVENTORY.csv | dbo.FuelInventory | Imported by primary key. |
| CSV/FUEL_ALLOCATIONS.csv | dbo.FuelAllocations | Imported by primary key after ships and purchases. |

The source schema contains 100 rows per table at inspection. The compatibility setup creates canonical app tables without IDENTITY keys, copies existing rows by primary key, and leaves source tables in place. The CSV importer skips existing primary keys and does not import `USER.csv` placeholder hashes.

## Relationships used by the app

## Relationships used by the app

- Users 1—N FuelPurchaseRequests (exec_id)
- Users 1—N AdminReviews (admin_id)
- Users 1—N Purchases (final_admin_id)
- Users 1—N FuelInventory (last_updated_by)
- Users 1—N FuelAllocations (allocated_by)
- Ships 1—N FuelPurchaseRequests, ShipHistory, FuelAllocations
- VendorOffers 1—N FuelPurchaseRequests
- FuelPurchaseRequests 1—1 AdminReviews
- FuelPurchaseRequests 1—1 Purchases
- Purchases 1—N FuelAllocations

## Workflow stored in existing tables

1. Executive/Inventory creates `FuelPurchaseRequests` (`Pending` or `Draft`).
2. Administrator writes `AdminReviews` (feasibility). Request becomes `In Review`.
3. Administrator updates the same `AdminReviews` row (vendor confirmation). Request becomes `Vendor Confirmation`.
4. Administrator final approval creates `Purchases` + `po_number` and sets request `Approved`. Rejection sets request `Rejected` and does **not** create a PO.
5. Operations may create `FuelAllocations` against an approved purchase.

Manager has monitoring/reporting access only. No extra approval table exists.

## Columns the UI derives (not stored)

- Current onboard fuel: latest `ShipHistory.fuel_onboard_mt` for the ship
- Nearby vendor: `VendorOffers` at the ship's `current_port`
- Nautical miles: **not stored**. Demo mode may show labelled sample NM values. SQL mode does not invent distances.
- Allocated stock: sum of `FuelAllocations.quantity_mt` that are not Cancelled
