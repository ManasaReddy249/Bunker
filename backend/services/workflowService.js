const { getRepos } = require('../repositories');
const HttpError = require('../utils/httpError');
const { REQUEST_STATUS, ROLES } = require('../utils/constants');
const { snapshot, enrichRequest } = require('./catalogService');
const { num } = require('./helpers');
const { poNumber } = require('../utils/ids');

const CREATORS = [ROLES.EXECUTIVE];
const ADMIN_ONLY = [ROLES.ADMINISTRATOR];

function assertRole(user, allowed, message) {
  if (!allowed.includes(user.role)) throw new HttpError(403, message);
}

async function listRequests() {
  const ctx = await snapshot();
  return ctx.requests.map((r) => enrichRequest(r, ctx)).sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
}

async function getRequest(id) {
  const ctx = await snapshot();
  const row = ctx.requests.find((r) => Number(r.request_id) === Number(id));
  if (!row) throw new HttpError(404, 'Request not found');
  return enrichRequest(row, ctx);
}

async function saveRequest(payload, user, id) {
  assertRole(user, CREATORS, 'Only an Executive can create fuel requests');
  const repos = getRepos();
  const ship = await repos.ships.findById(payload.ship_id);
  const vendor = await repos.vendors.findById(payload.vendor_offer_id);
  if (!ship) throw new HttpError(400, 'Ship is required and must exist');
  if (!vendor) throw new HttpError(400, 'Vendor offer is required and must exist');
  if (!(num(payload.quantity_mt) > 0)) throw new HttpError(400, 'Quantity must be greater than zero');
  if (!payload.expected_delivery_date) throw new HttpError(400, 'Expected delivery date is required');

  const body = {
    exec_id: user.user_id,
    ship_id: Number(payload.ship_id),
    vendor_offer_id: Number(payload.vendor_offer_id),
    quantity_mt: num(payload.quantity_mt),
    expected_price_per_mt: num(payload.expected_price_per_mt || vendor.price_per_mt),
    request_date: payload.request_date || new Date().toISOString(),
    expected_delivery_date: payload.expected_delivery_date,
    request_status: payload.save_draft ? REQUEST_STATUS.DRAFT : REQUEST_STATUS.PENDING,
    remarks: payload.remarks || null
  };

  if (id) {
    const current = await repos.requests.findById(id);
    if (!current) throw new HttpError(404, 'Request not found');
    if (!['Draft', 'Pending'].includes(current.request_status)) {
      throw new HttpError(400, 'Only draft or pending requests can be edited');
    }
    await repos.requests.update(id, { ...body, exec_id: current.exec_id, request_date: current.request_date });
    return getRequest(id);
  }
  const created = await repos.requests.create(body);
  return getRequest(created.request_id);
}

async function finalApproval(payload, user) {
  assertRole(user, ADMIN_ONLY, 'Only an Administrator can give final approval');
  const repos = getRepos();
  const request = await repos.requests.findById(payload.request_id);
  if (!request) throw new HttpError(404, 'Request not found');
  if (![REQUEST_STATUS.PENDING, 'In Review', 'Vendor Confirmation'].includes(request.request_status)) {
    throw new HttpError(400, 'Only an unreviewed fuel request can be approved or rejected');
  }
  const existingPurchase = await repos.purchases.findByRequestId(request.request_id);
  if (existingPurchase) throw new HttpError(409, 'A purchase record already exists for this request');
  const review = await repos.reviews.findByRequestId(request.request_id);

  if (payload.decision === 'Rejected') {
    await repos.requests.update(request.request_id, { request_status: REQUEST_STATUS.REJECTED, remarks: payload.remarks || request.remarks });
    return getRequest(request.request_id);
  }

  if (payload.decision !== 'Approved') throw new HttpError(400, 'Decision must be Approved or Rejected');
  const price = num(review?.confirmed_price_per_mt || request.expected_price_per_mt);
  const qty = num(review?.confirmed_quantity_mt || request.quantity_mt);
  const purchases = await repos.purchases.list();
  const po = poNumber(purchases, new Date());
  await repos.purchases.create({
    request_id: request.request_id,
    final_admin_id: user.user_id,
    final_price_per_mt: price,
    total_cost: Math.round(price * qty * 100) / 100,
    purchase_date: new Date().toISOString(),
    status: 'Approved',
    po_number: po
  });
  await repos.requests.update(request.request_id, { request_status: REQUEST_STATUS.APPROVED, remarks: payload.remarks || request.remarks });
  return getRequest(request.request_id);
}

async function listApprovals() {
  const requests = await listRequests();
  return {
    pending: requests.filter((r) => [REQUEST_STATUS.PENDING, 'In Review', 'Vendor Confirmation'].includes(r.request_status)),
    approved: requests.filter((r) => r.request_status === REQUEST_STATUS.APPROVED),
    rejected: requests.filter((r) => r.request_status === REQUEST_STATUS.REJECTED)
  };
}

async function listPurchases() {
  const ctx = await snapshot();
  return ctx.purchases.map((p) => {
    const req = ctx.requests.find((r) => Number(r.request_id) === Number(p.request_id));
    const enriched = req ? enrichRequest(req, ctx) : {};
    return { ...p, total_cost: num(p.total_cost), ...enriched, purchase_id: p.purchase_id, status: p.status, po_number: p.po_number };
  });
}

module.exports = {
  listRequests,
  getRequest,
  saveRequest,
  finalApproval,
  listApprovals,
  listPurchases
};
