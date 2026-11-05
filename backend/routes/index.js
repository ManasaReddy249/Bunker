const express = require('express');
const { requireAuth, requireRoles, attachUser } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const c = require('../controllers/appController');
const auth = require('../controllers/authController');

const router = express.Router();
const admin = [ROLES.ADMINISTRATOR];
const userAdmin = [ROLES.USER_ADMINISTRATOR];
const executiveWrite = [ROLES.ADMINISTRATOR, ROLES.EXECUTIVE];
const requestReaders = [ROLES.ADMINISTRATOR, ROLES.EXECUTIVE];
const fuelReaders = [ROLES.ADMINISTRATOR, ROLES.EXECUTIVE];
const reqWrite = [ROLES.EXECUTIVE];

router.get('/meta', c.meta);
router.get('/health', c.health);

router.post('/auth/login', auth.login);
router.post('/auth/register', auth.register);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, attachUser, auth.me);

router.use(requireAuth, attachUser);

router.get('/dashboard/summary', c.dashboardSummary);
router.get('/dashboard/ship-overview', requireRoles(...fuelReaders), c.dashboardShips);
router.get('/dashboard/consumption', requireRoles(...fuelReaders), c.dashboardConsumption);

router.get('/users', requireRoles(...userAdmin), c.usersList);
router.post('/users', requireRoles(...userAdmin), c.usersCreate);
router.put('/users/:id', requireRoles(...userAdmin), c.usersUpdate);
router.patch('/users/:id/status', requireRoles(...userAdmin), c.usersStatus);

router.get('/ships', requireRoles(...fuelReaders), c.shipsList);
router.post('/ships', requireRoles(...executiveWrite), c.shipsCreate);
router.get('/ships/:id', requireRoles(...fuelReaders), c.shipsGet);
router.put('/ships/:id', requireRoles(...executiveWrite), c.shipsUpdate);

router.get('/vendors/comparison', requireRoles(...fuelReaders), c.vendorsComparison);
router.get('/vendors', requireRoles(...fuelReaders), c.vendorsList);
router.get('/vendors/:id', requireRoles(...fuelReaders), c.vendorsGet);

router.get('/requests', requireRoles(...requestReaders), c.requestsList);
router.post('/requests', requireRoles(...reqWrite), c.requestsCreate);
router.get('/requests/:id', requireRoles(...requestReaders), c.requestsGet);
router.put('/requests/:id', requireRoles(...reqWrite), c.requestsUpdate);

router.get('/approvals', requireRoles(...admin), c.approvalsList);
router.post('/approvals/final', requireRoles(...admin), c.approvalsFinal);

router.get('/purchases', requireRoles(...fuelReaders), c.purchasesList);
router.get('/purchases/:id', requireRoles(...fuelReaders), c.purchasesGet);

router.get('/inventory', requireRoles(...fuelReaders), c.inventoryList);
router.post('/inventory', requireRoles(...executiveWrite), c.inventoryCreate);
router.put('/inventory/:id', requireRoles(...executiveWrite), c.inventoryUpdate);

router.get('/allocations', requireRoles(...fuelReaders), c.allocationsList);
router.post('/allocations', requireRoles(...executiveWrite), c.allocationsCreate);
router.put('/allocations/:id', requireRoles(...executiveWrite), c.allocationsUpdate);

router.get('/planning', requireRoles(...fuelReaders), c.planning);
router.get('/reports/consumption', requireRoles(...admin), c.reportsConsumption);
router.get('/reports/purchases', requireRoles(...admin), c.reportsPurchases);
router.get('/reports/inventory', requireRoles(...admin), c.reportsInventory);

module.exports = router;
