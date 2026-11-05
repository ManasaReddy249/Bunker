# BunkerSmart — Maritime Fuel Management System

BunkerSmart is a full-stack application for managing fuel supply across a ship fleet. Executives submit purchase requests, the Fuel Administrator reviews feasibility and supplier quotations before approval, and the User Administrator manages accounts and access. Ships, supplier offers, inventory, allocations, approvals, purchase orders, and fuel history are stored in SQL Server when SQL mode is enabled.

## Technology at a glance

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, and Lucide icons.
- **Backend:** Node.js, Express, JWT authentication, bcrypt password hashing, and the `mssql` driver with `msnodesqlv8`.
- **Database:** Microsoft SQL Server with Windows Authentication. Nine canonical application tables are documented in `database/schema-reference.sql`.

## Project structure

```text
BunkerSmart/
├── README.md
├── database/                 SQL reference, mapping, seed scripts, and CSV sample data
├── backend/
│   ├── config/                Environment and SQL Server connection
│   ├── controllers/           HTTP request handlers
│   ├── middleware/            JWT authentication and role checks
│   ├── repositories/          SQL and in-memory data implementations
│   ├── routes/                REST API route declarations
│   ├── services/              Fuel, approval, planning, report, and auth logic
│   └── scripts/               Database inspection, compatibility, import, and seeding
└── frontend/
    └── src/
        ├── components/        Shared cards, badges, tables, forms, and dialogs
        ├── context/            Authentication context
        ├── layouts/            Main application shell and navigation
        ├── pages/              Dashboard and feature screens
        ├── services/           Axios API client
        └── utils/              Formatting and export helpers
```

## Requirements

- Node.js 22 or newer and npm
- Windows machine on the organization network for the configured SQL Server
- SQL Server instance `INBAAVVMMARSSQL`, database `B3A-S7-T1`
- Windows Authentication and ODBC Driver 17 for SQL Server
- Visual C++ build tools if `msnodesqlv8` needs to compile during installation

The database is not expected to be reachable from every network. If the SQL connection fails away from the office, run the app in demo mode for a UI walkthrough, then switch back to SQL mode at the office.

## Install dependencies

From the project root:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

## Configure SQL mode

`backend/.env` controls the API and database connection. Copy `backend/.env.example` to `backend/.env` if needed, then confirm these values:

```dotenv
PORT=5000
DEMO_MODE=false
DB_SERVER=INBAAVVMMARSSQL
DB_DATABASE=B3A-S7-T1
ODBC_DRIVER=ODBC Driver 17 for SQL Server
```

The SQL driver uses Windows Trusted Connection; it does not require a SQL username or password in `.env`. Do not commit `.env` or real credentials.

On the office network, open a terminal in `backend` and run:

```powershell
npm run test-db
npm run inspect-db
npm run setup:sql-compat
npm run import:sample-data
npm run seed:demo-users
```

The compatibility setup prepares the canonical tables and copies rows from the existing legacy tables without dropping the source tables. The sample importer and demo-user seeder can be rerun. The schema mapping is documented in `database/schema-mapping.md`.

## Run the app

Start the API in one terminal:

```powershell
cd backend
npm run dev
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` calls to the backend at `http://localhost:5000`. Check API health at `http://localhost:5000/api/health`.

### Run without SQL Server

Set `DEMO_MODE=true` in `backend/.env`, then restart the backend. The demo repository uses bundled CSV data and an in-memory store. Changes made in demo mode are temporary and are not saved to SQL Server. Set `DEMO_MODE=false` again when you are at the office and want signup and app changes written to the database.

## Demo accounts

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `Admin@123` | Fuel Administrator (`Administrator`) |
| `useradmin` | `UserAdmin@123` | User Administrator |
| `executive` | `Executive@123` | Executive |

Demo IDs are reserved from `90001` so they do not collide with imported business IDs. These are development credentials only; replace them for any real deployment.

## Roles and workflows

- **Executive:** views the fleet and vendor quotations, creates and tracks fuel requests, and works with planning, inventory, and operations.
- **Fuel Administrator:** reviews fuel requests and approvals, vendor pricing, inventory, fleet operations, and reports.
- **User Administrator:** manages user accounts and roles from a user-focused dashboard. This role does not manage fuel approvals.

Public signup creates an active Executive account and signs the user in. In SQL mode the account is persisted in `dbo.Users`; demo-mode accounts live only in memory. A ship's total fuel capacity is fixed after the ship is created. Operations allocations can be filtered by day or month and default to the most recent period.

Fuel request flow:

1. An Executive chooses a ship and vendor offer, then saves a draft or submits a request.
2. The Fuel Administrator reviews ship capacity, onboard fuel, vendor availability, and the quoted price.
3. The Fuel Administrator approves or rejects the request. Approval creates a purchase record and purchase order number.
4. Operations staff can associate allocations with the approved purchase order and record delivery progress.

## API overview

All API paths below are prefixed with `/api`. Authenticated API calls use a bearer JWT, stored in the frontend under `bs_token`.

| Area | Endpoints | Purpose |
| --- | --- | --- |
| Health and metadata | `GET /health`, `GET /meta` | Server/database mode and app metadata |
| Authentication | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me` | Sign in, signup, logout, and current user |
| Dashboard | `GET /dashboard/summary`, `/dashboard/ship-overview`, `/dashboard/consumption` | Role-aware KPI and fleet summaries |
| Users | `GET /users`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id/status` | User Administrator account management |
| Ships | `GET /ships`, `GET /ships/:id`, `POST /ships`, `PUT /ships/:id` | Fleet records and ship fuel history |
| Vendors | `GET /vendors`, `/vendors/:id`, `/vendors/comparison` | Supplier offers and price comparison |
| Requests | `GET /requests`, `/requests/:id`, `POST /requests`, `PUT /requests/:id` | Fuel purchase request workflow |
| Approvals | `GET /approvals`, `POST /approvals/final` | Fuel Administrator review and final decision |
| Purchases | `GET /purchases`, `GET /purchases/:id` | Approved purchases and purchase orders |
| Inventory and allocations | `GET/POST /inventory`, `PUT /inventory/:id`, `GET/POST /allocations`, `PUT /allocations/:id` | Fuel stock and planned/completed deliveries |
| Planning and reports | `GET /planning`, `GET /reports/consumption`, `/reports/purchases`, `/reports/inventory` | Historical planning and report datasets |

Role checks are enforced in the backend as well as the frontend. Signup is public, but assigns the Executive role; users cannot choose an administrator role during signup.

## Database tables

The canonical SQL schema contains `Users`, `Ships`, `VendorOffers`, `FuelPurchaseRequests`, `AdminReviews`, `Purchases`, `ShipHistory`, `FuelInventory`, and `FuelAllocations`. Foreign keys connect requests to users, ships, and offers; reviews and purchases to requests; history and allocations to ships; and allocations to purchases. See `database/schema-reference.sql` for columns and constraints.

## Troubleshooting

- **SQL server unreachable:** confirm office/VPN network access, server and database values, Windows permissions, and ODBC Driver 17. `npm run test-db` reports connection status.
- **Missing canonical tables:** at the office, run `npm run setup:sql-compat` from `backend`, followed by `npm run seed:demo-users`.
- **Login fails in SQL mode:** run `npm run seed:demo-users`. Imported source accounts may not have usable bcrypt password hashes.
- **`msnodesqlv8` install/build error:** install Visual Studio C++ build tools and retry `npm install` in `backend`.
- **Port already in use:** change `PORT` in `backend/.env`, or adjust the Vite server port in `frontend/vite.config.js`.
- **Need to inspect tables:** use `npm run inspect-db` from `backend` while SQL Server is reachable.

## Notes for review

The app uses React local state and Context for frontend state, Axios for API calls, and Express services/repositories to separate HTTP handling, business rules, and persistence. Charts use Recharts; data tables use semantic HTML with Tailwind styling. The downloadable project review guide is `BunkerSmart_Project_Review_Guide.docx`.
