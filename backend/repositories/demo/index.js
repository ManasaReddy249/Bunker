const { store } = require('./store');
const { nextId } = require('../../utils/ids');
const { ID_START } = require('../../utils/constants');

function byId(list, key, id) {
  return list.find((row) => Number(row[key]) === Number(id)) || null;
}

const demoRepos = {
  mode: 'demo',

  users: {
    async findByLogin(login) {
      const value = String(login || '').toLowerCase();
      return store.users.find((u) => u.username.toLowerCase() === value || u.email.toLowerCase() === value) || null;
    },
    async findById(id) {
      return byId(store.users, 'user_id', id);
    },
    async list() {
      return [...store.users];
    },
    async create(row) {
      const user = { ...row, user_id: nextId(store.users, 'user_id', ID_START.users), imported: false };
      store.users.push(user);
      return user;
    },
    async update(id, patch) {
      const user = byId(store.users, 'user_id', id);
      if (!user) return null;
      Object.assign(user, patch);
      return user;
    }
  },

  ships: {
    async list() {
      return [...store.ships];
    },
    async findById(id) {
      return byId(store.ships, 'ship_id', id);
    },
    async create(row) {
      const ship = { ...row, ship_id: nextId(store.ships, 'ship_id', ID_START.ships) };
      store.ships.push(ship);
      return ship;
    },
    async update(id, patch) {
      const ship = byId(store.ships, 'ship_id', id);
      if (!ship) return null;
      Object.assign(ship, patch);
      return ship;
    }
  },

  vendors: {
    async list() {
      return [...store.vendorOffers];
    },
    async findById(id) {
      return byId(store.vendorOffers, 'vendor_offer_id', id);
    }
  },

  requests: {
    async list() {
      return [...store.requests];
    },
    async findById(id) {
      return byId(store.requests, 'request_id', id);
    },
    async create(row) {
      const item = { ...row, request_id: nextId(store.requests, 'request_id', ID_START.requests) };
      store.requests.push(item);
      return item;
    },
    async update(id, patch) {
      const item = byId(store.requests, 'request_id', id);
      if (!item) return null;
      Object.assign(item, patch);
      return item;
    }
  },

  reviews: {
    async list() {
      return [...store.reviews];
    },
    async findByRequestId(requestId) {
      return byId(store.reviews, 'request_id', requestId);
    },
    async create(row) {
      const item = { ...row, admin_review_id: nextId(store.reviews, 'admin_review_id', ID_START.reviews) };
      store.reviews.push(item);
      return item;
    },
    async updateByRequestId(requestId, patch) {
      const item = byId(store.reviews, 'request_id', requestId);
      if (!item) return null;
      Object.assign(item, patch);
      return item;
    }
  },

  purchases: {
    async list() {
      return [...store.purchases];
    },
    async findById(id) {
      return byId(store.purchases, 'purchase_id', id);
    },
    async findByRequestId(requestId) {
      return byId(store.purchases, 'request_id', requestId);
    },
    async create(row) {
      const item = { ...row, purchase_id: nextId(store.purchases, 'purchase_id', ID_START.purchases) };
      store.purchases.push(item);
      return item;
    }
  },

  history: {
    async list() {
      return [...store.shipHistory];
    },
    async listByShip(shipId) {
      return store.shipHistory.filter((h) => Number(h.ship_id) === Number(shipId));
    },
    async create(row) {
      const item = { ...row, history_id: nextId(store.shipHistory, 'history_id', ID_START.history) };
      store.shipHistory.push(item);
      return item;
    }
  },

  inventory: {
    async list() {
      return [...store.inventory];
    },
    async findById(id) {
      return byId(store.inventory, 'inventory_id', id);
    },
    async findByPortFuel(port, fuelType) {
      return store.inventory.find((i) => i.port === port && i.fuel_type === fuelType) || null;
    },
    async create(row) {
      const item = { ...row, inventory_id: nextId(store.inventory, 'inventory_id', ID_START.inventory) };
      store.inventory.push(item);
      return item;
    },
    async update(id, patch) {
      const item = byId(store.inventory, 'inventory_id', id);
      if (!item) return null;
      Object.assign(item, patch);
      return item;
    }
  },

  allocations: {
    async list() {
      return [...store.allocations];
    },
    async findById(id) {
      return byId(store.allocations, 'allocation_id', id);
    },
    async create(row) {
      const item = { ...row, allocation_id: nextId(store.allocations, 'allocation_id', ID_START.allocations) };
      store.allocations.push(item);
      return item;
    },
    async update(id, patch) {
      const item = byId(store.allocations, 'allocation_id', id);
      if (!item) return null;
      Object.assign(item, patch);
      return item;
    }
  },

  async nextNumericId(tableKey) {
    const map = {
      users: [store.users, 'user_id', ID_START.users],
      ships: [store.ships, 'ship_id', ID_START.ships],
      vendors: [store.vendorOffers, 'vendor_offer_id', ID_START.vendors],
      requests: [store.requests, 'request_id', ID_START.requests],
      reviews: [store.reviews, 'admin_review_id', ID_START.reviews],
      purchases: [store.purchases, 'purchase_id', ID_START.purchases],
      history: [store.shipHistory, 'history_id', ID_START.history],
      inventory: [store.inventory, 'inventory_id', ID_START.inventory],
      allocations: [store.allocations, 'allocation_id', ID_START.allocations]
    };
    const [rows, key, start] = map[tableKey];
    return nextId(rows, key, start);
  }
};

module.exports = demoRepos;
