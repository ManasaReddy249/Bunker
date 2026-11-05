import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Empty, Loading, ErrorBanner, Modal } from '../../components/Ui';
import { fmt, errorMessage } from '../../utils/format';

const FUELS = ['IFO 380', 'MGO', 'MDO', 'LNG'];

export default function InventoryPage({ view = 'all' }) {
  const { user } = useAuth();
  const canInv = ['Administrator', 'Executive'].includes(user?.role);
  const canOps = ['Administrator', 'Executive'].includes(user?.role);
  const [data, setData] = useState(null);
  const [allocs, setAllocs] = useState([]);
  const [period, setPeriod] = useState('day');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [ships, setShips] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [form, setForm] = useState({ port: '', fuel_type: 'IFO 380', available_quantity_mt: '', reorder_level_mt: '' });
  const [editing, setEditing] = useState(null);
  const [alloc, setAlloc] = useState({ ship_id: '', fuel_type: 'IFO 380', quantity_mt: '', purchase_id: '', status: 'Planned', remarks: '' });

  async function load() {
    try {
      const [inv, al, sh, pu] = await Promise.all([api.get('/inventory'), api.get('/allocations'), api.get('/ships'), api.get('/purchases')]);
      setData(inv.data);
      setAllocs(al.data);
      if (al.data.length && !selectedPeriod) {
        const newest = [...al.data].sort((a,b)=>new Date(b.allocation_date)-new Date(a.allocation_date))[0];
        const date = new Date(newest.allocation_date);
        setSelectedPeriod(period === 'month' ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : date.toISOString().slice(0,10));
      }
      setShips(sh.data);
      setPurchases(pu.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  useEffect(() => { load(); }, []);

  if (!data && !error) return <Loading />;
  const rows = (data?.rows || []).filter((r) => `${r.port} ${r.fuel_type}`.toLowerCase().includes(q.toLowerCase()));
  const showInventory = view !== 'operations';
  const showOperations = view !== 'inventory';
  const latestAllocation = [...allocs].sort((a,b)=>new Date(b.allocation_date)-new Date(a.allocation_date))[0];
  const allocationPeriodValue = selectedPeriod || (latestAllocation ? (period === 'month' ? new Date(latestAllocation.allocation_date).toISOString().slice(0,7) : new Date(latestAllocation.allocation_date).toISOString().slice(0,10)) : new Date().toISOString().slice(0,10));
  const visibleAllocations = allocs.filter((a) => {
    const date = new Date(a.allocation_date);
    const key = period === 'month' ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : date.toISOString().slice(0,10);
    return key === allocationPeriodValue;
  });

  async function saveInv(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/inventory/${editing}`, form);
      else await api.post('/inventory', form);
      setOpen(false);
      await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  async function saveAlloc(e) {
    e.preventDefault();
    try {
      await api.post('/allocations', alloc);
      setAllocOpen(false);
      await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{view === 'operations' ? 'Operations' : 'Inventory'}</h1>
          <p className="text-sm text-slate-500">{view === 'operations' ? 'Fuel allocation and delivery activity' : 'Stock quantities in metric tonnes (MT)'}</p>
        </div>
        <div className="flex gap-2">
          {canOps && showOperations && <button className="btn-ghost" onClick={() => setAllocOpen(true)}>New allocation</button>}
          {canInv && showInventory && <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>Update stock</button>}
        </div>
      </div>
      <ErrorBanner message={error} />
      {showInventory && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card title="Total available">{fmt(data?.totals?.available_mt)} MT</Card>
            {(data?.by_type || []).map((t) => (
              <Card key={t.fuel_type} title={t.fuel_type}>
                <div>{fmt(t.available_mt)} MT available</div>
                <div className="text-sm text-slate-500">{fmt(t.allocated_mt)} MT allocated</div>
              </Card>
            ))}
          </div>
          <input className="input max-w-sm" placeholder="Search port or fuel type" value={q} onChange={(e) => setQ(e.target.value)} />
          <Card title="Stock by port and fuel type">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Port</th><th>Fuel</th><th>Available (MT)</th><th>Reorder level</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.inventory_id}>
                      <td>{r.port}</td>
                      <td>{r.fuel_type}</td>
                      <td>{fmt(r.available_quantity_mt)}</td>
                      <td>{fmt(r.reorder_level_mt)}</td>
                      <td>{r.is_low ? <Badge status="Low">Low stock</Badge> : <Badge status="Available">OK</Badge>}</td>
                      <td>{canInv && <button className="btn-ghost" onClick={() => { setEditing(r.inventory_id); setForm(r); setOpen(true); }}>Edit</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && <Empty title="No inventory records" />}
            </div>
          </Card>
        </>
      )}
      {showOperations && (
        <Card title="Fuel allocations">
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-chart-hover p-3">
            <span className="text-sm font-semibold text-navy">Filter operations</span>
            <select className="input max-w-36" value={period} onChange={(e)=>{setPeriod(e.target.value);setSelectedPeriod('');}} aria-label="Date filter period"><option value="day">By day</option><option value="month">By month</option></select>
            <input className="input max-w-52" type={period === 'day' ? 'date' : 'month'} value={allocationPeriodValue} onChange={(e)=>setSelectedPeriod(e.target.value)} aria-label={period === 'day' ? 'Filter by day' : 'Filter by month'} />
            <span className="text-xs text-muted">Showing the most recent period by default</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ship</th><th>Fuel</th><th>Qty</th><th>Date</th><th>Status</th><th>PO</th></tr></thead>
              <tbody>
                {visibleAllocations.map((a) => (
                  <tr key={a.allocation_id}>
                    <td>{a.ship_name}</td>
                    <td>{a.fuel_type}</td>
                    <td>{fmt(a.quantity_mt)}</td>
                    <td>{String(a.allocation_date).slice(0, 10)}</td>
                    <td><Badge status={a.status}>{a.status}</Badge></td>
                    <td>{a.po_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleAllocations.length && <Empty title="No allocations in this period" />}
          </div>
        </Card>
      )}
      <Modal open={open} title={editing ? 'Update stock' : 'Add stock'} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={saveInv}>
          <input className="input" placeholder="Port" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required />
          <select className="input" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select>
          <input className="input" type="number" min="0" step="0.01" placeholder="Available MT" value={form.available_quantity_mt} onChange={(e) => setForm({ ...form, available_quantity_mt: e.target.value })} required />
          <input className="input" type="number" min="0" step="0.01" placeholder="Reorder level MT" value={form.reorder_level_mt} onChange={(e) => setForm({ ...form, reorder_level_mt: e.target.value })} required />
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>
      <Modal open={allocOpen} title="Allocate fuel" onClose={() => setAllocOpen(false)}>
        <form className="space-y-3" onSubmit={saveAlloc}>
          <select className="input" value={alloc.ship_id} onChange={(e) => setAlloc({ ...alloc, ship_id: e.target.value })} required>
            <option value="">Ship</option>
            {ships.map((s) => <option key={s.ship_id} value={s.ship_id}>{s.ship_name} ({s.current_port})</option>)}
          </select>
          <select className="input" value={alloc.fuel_type} onChange={(e) => setAlloc({ ...alloc, fuel_type: e.target.value })}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select>
          <input className="input" type="number" min="0.01" step="0.01" placeholder="Quantity MT" value={alloc.quantity_mt} onChange={(e) => setAlloc({ ...alloc, quantity_mt: e.target.value })} required />
          <select className="input" value={alloc.purchase_id} onChange={(e) => setAlloc({ ...alloc, purchase_id: e.target.value })}>
            <option value="">No purchase link</option>
            {purchases.map((p) => <option key={p.purchase_id} value={p.purchase_id}>{p.po_number}</option>)}
          </select>
          <select className="input" value={alloc.status} onChange={(e) => setAlloc({ ...alloc, status: e.target.value })}>
            <option>Planned</option><option>Completed</option><option>Cancelled</option>
          </select>
          <input className="input" placeholder="Remarks" value={alloc.remarks} onChange={(e) => setAlloc({ ...alloc, remarks: e.target.value })} />
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setAllocOpen(false)}>Cancel</button><button className="btn-primary">Allocate</button></div>
        </form>
      </Modal>
    </div>
  );
}
