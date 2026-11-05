const ROLES = {
  ADMINISTRATOR: 'Administrator',
  USER_ADMINISTRATOR: 'User Administrator',
  EXECUTIVE: 'Executive'
};

const ALL_ROLES = Object.values(ROLES);

const REQUEST_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const FEASIBILITY = {
  PENDING: 'Pending',
  FEASIBLE: 'Feasible',
  NOT_FEASIBLE: 'Not Feasible'
};

const VENDOR_CONFIRM = {
  PENDING: 'Pending',
  AVAILABLE: 'Available',
  NOT_AVAILABLE: 'Not Available'
};

const FUEL_TYPES = ['IFO 380', 'MGO', 'MDO', 'LNG'];

const ID_START = {
  users: 90001,
  ships: 1001,
  vendors: 2001,
  inventory: 3001,
  allocations: 4001,
  requests: 5001,
  reviews: 6001,
  purchases: 7001,
  history: 9001
};

module.exports = {
  ROLES,
  ALL_ROLES,
  REQUEST_STATUS,
  FEASIBILITY,
  VENDOR_CONFIRM,
  FUEL_TYPES,
  ID_START
};
