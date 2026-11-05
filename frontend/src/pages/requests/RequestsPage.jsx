import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Empty, Loading, ErrorBanner } from '../../components/Ui';
import { fmt, money, errorMessage } from '../../utils/format';

const STEPS = ['Executive request', 'Admin decision', 'Purchase order'];

export default function RequestsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'Executive';
  const [ships, setShips] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ship_id: '', vendor_offer_id: '', quantity_mt: '', expected_price_per_mt: '', expected_delivery_date: '', remarks: ''
  });

  async function load() {
    setLoading(true);
    try {
      const [s, v, r] = await Promise.all([api.get('/ships'), api.get('/vendors'), api.get('/requests')]);
      setShips(s.data);
      setVendors(v.data);
      setRequests(r.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const ship = ships.find((s) => String(s.ship_id) === String(form.ship_id));
  const vendor = vendors.find((v) => String(v.vendor_offer_id) === String(form.vendor_offer_id));
  const total = Number(form.quantity_mt || 0) * Number(form.expected_price_per_mt || vendor?.price_per_mt || 0);

  useEffect(() => {
    if (vendor) setForm((f) => ({ ...f, expected_price_per_mt: vendor.price_per_mt }));
  }, [form.vendor_offer_id]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(saveDraft) {
    setError('');
    setMessage('');
    try {
      await api.post('/requests', { ...form, save_draft: saveDraft, expected_price_per_mt: form.expected_price_per_mt || vendor?.price_per_mt });
      setMessage(saveDraft ? 'Draft saved.' : 'Request submitted.');
      setForm({ ship_id: '', vendor_offer_id: '', quantity_mt: '', expected_price_per_mt: '', expected_delivery_date: '', remarks: '' });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <Loading />;

  if (!canWrite) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Fuel Requests</h1>
          <p className="text-sm text-slate-500">Read-only request register</p>
        </div>
        <ErrorBanner message={error} />
        <Card title="Executive requests">
          {requests.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Request</th><th>Executive</th><th>Ship</th><th>Vendor</th><th>Quantity</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.request_id}>
                      <td>FR-{request.request_id}</td>
                      <td>{request.exec_name || '—'}</td>
                      <td>{request.ship_name || '—'}</td>
                      <td>{request.vendor_name || '—'}</td>
                      <td>{fmt(request.quantity_mt)} MT</td>
                      <td>{String(request.request_date).slice(0, 10)}</td>
                      <td><Badge status={request.request_status}>{request.request_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No fuel requests" />}
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Executive Fuel Request</h1>
          <p className="text-sm text-slate-500">Select a ship and vendor offer, then submit for Admin approval.</p>
        </div>
        <ErrorBanner message={error} />
        {message && <div className="rounded-lg bg-status-valid/10 px-3 py-2 text-sm text-status-valid">{message}</div>}
        <Card title="1. Ship details">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Ship name *
              <select className="input mt-1" value={form.ship_id} onChange={(e) => set('ship_id', e.target.value)}>
                <option value="">Select ship</option>
                {ships.map((s) => <option key={s.ship_id} value={s.ship_id}>{s.ship_name}</option>)}
              </select>
            </label>
            <label className="text-sm">Current location<input className="input mt-1" value={ship?.current_port || ''} readOnly /></label>
            <label className="text-sm">Destination<input className="input mt-1" value={ship?.destination || ''} readOnly /></label>
            <label className="text-sm">Capacity (MT)<input className="input mt-1" value={ship ? fmt(ship.total_fuel_capacity_mt) : ''} readOnly /></label>
            <label className="text-sm">Current onboard (MT)<input className="input mt-1" value={ship?.current_fuel_mt == null ? '' : fmt(ship.current_fuel_mt)} readOnly /></label>
          </div>
        </Card>
        <Card title="2. Vendor & port">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Select vendor *
              <select className="input mt-1" value={form.vendor_offer_id} onChange={(e) => set('vendor_offer_id', e.target.value)}>
                <option value="">Select offer</option>
                {vendors.map((v) => <option key={v.vendor_offer_id} value={v.vendor_offer_id}>{v.vendor_name} — {v.port} — {v.fuel_type}</option>)}
              </select>
            </label>
            <label className="text-sm">Port name<input className="input mt-1" value={vendor?.port || ''} readOnly /></label>
            <div className="md:col-span-2 text-sm">Availability: {vendor ? <Badge status={vendor.status}>{vendor.status}</Badge> : '—'}</div>
          </div>
        </Card>
        <Card title="3. Fuel requirements">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fuel type</th><th>Qty (MT)</th><th>Expected price (USD/MT)</th><th>Total</th></tr></thead>
              <tbody>
                <tr>
                  <td>{vendor?.fuel_type || '—'}</td>
                  <td><input className="input" type="number" min="0" value={form.quantity_mt} onChange={(e) => set('quantity_mt', e.target.value)} /></td>
                  <td><input className="input" type="number" min="0" value={form.expected_price_per_mt} onChange={(e) => set('expected_price_per_mt', e.target.value)} /></td>
                  <td className="font-semibold">{money(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="4. Additional information">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Expected delivery date *
              <input className="input mt-1" type="date" value={form.expected_delivery_date} onChange={(e) => set('expected_delivery_date', e.target.value)} />
            </label>
            <label className="text-sm">Remarks
              <input className="input mt-1" value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
            </label>
          </div>
          {canWrite && (
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => submit(true)}>Save draft</button>
              <button className="btn-primary" onClick={() => submit(false)}>Submit request</button>
            </div>
          )}
        </Card>
        <Card title="Request history">
          {requests.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Ship</th><th>Vendor</th><th>Qty</th><th>Status</th></tr></thead>
                <tbody>
                  {requests.slice(0, 12).map((r) => (
                    <tr key={r.request_id}>
                      <td>FR-{r.request_id}</td>
                      <td>{r.ship_name}</td>
                      <td>{r.vendor_name}</td>
                      <td>{fmt(r.quantity_mt)}</td>
                      <td><Badge status={r.request_status}>{r.request_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No requests yet" />}
        </Card>
      </div>
      <div className="space-y-5">
        <Card title="Request workflow">
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white">{i + 1}</span>
                <div>
                  <div className="font-medium text-navy">{step}</div>
                  <div className="text-xs text-slate-500">{i === 0 ? 'Submitted by Executive' : i === 1 ? 'Approved or rejected by Admin' : 'Generated after approval'}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Recent requests">
          {requests.slice(0, 6).map((r) => (
            <div key={r.request_id} className="mb-2 flex items-center justify-between text-sm">
              <span>FR-{r.request_id} · {r.ship_name}</span>
              <Badge status={r.request_status}>{r.request_status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
