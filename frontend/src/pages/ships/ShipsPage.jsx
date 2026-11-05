import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Empty, Loading, ErrorBanner, Modal } from '../../components/Ui';
import { fmt, errorMessage } from '../../utils/format';

const emptyForm = { ship_name: '', current_port: '', destination: '', total_fuel_capacity_mt: '', ship_status: 'At Port', current_fuel_mt: '' };

export default function ShipsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = ['Administrator', 'Executive'].includes(user?.role);
  const [ships, setShips] = useState([]);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/ships');
      setShips(data);
      if (id) {
        const d = await api.get(`/ships/${id}`);
        setDetail(d.data);
      } else setDetail(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const filtered = useMemo(() => ships.filter((s) => {
    const match = `${s.ship_name} ${s.current_port} ${s.destination}`.toLowerCase().includes(q.toLowerCase());
    const st = status === 'All' || s.ship_status === status;
    return match && st;
  }), [ships, q, status]);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/ships/${editing}`, form);
      else await api.post('/ships', form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (loading) return <Loading />;

  if (detail && id) {
    return (
      <div className="space-y-5">
        <button className="btn-ghost" onClick={() => navigate('/ships')}>Back</button>
        <h1 className="text-2xl font-semibold text-navy">{detail.ship_name}</h1>
        <ErrorBanner message={error} />
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Voyage"><p>{detail.current_port} → {detail.destination}</p><Badge status={detail.ship_status}>{detail.ship_status}</Badge></Card>
          <Card title="Fuel capacity (locked)"><p className="text-2xl font-semibold text-navy">{fmt(detail.total_fuel_capacity_mt)} MT</p><p className="mt-2 text-sm text-slate-500">Fixed tank capacity</p><p className="mt-3">Onboard {detail.current_fuel_mt == null ? '—' : `${fmt(detail.current_fuel_mt)} MT`}</p></Card>
          <Card title="Nearby vendor"><p>{detail.nearby_vendor || '—'}</p></Card>
        </div>
        <Card title="Fuel history">
          {detail.history?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Port</th><th>Destination</th><th>Onboard</th><th>Consumed</th><th>Remarks</th></tr></thead>
                <tbody>
                  {detail.history.map((h) => (
                    <tr key={h.history_id}>
                      <td>{String(h.recorded_date).slice(0, 16)}</td>
                      <td>{h.port}</td>
                      <td>{h.destination}</td>
                      <td>{fmt(h.fuel_onboard_mt)}</td>
                      <td>{fmt(h.fuel_consumed_mt)}</td>
                      <td>{h.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No history readings" />}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Ships</h1>
        <p className="text-sm text-slate-500">Fleet location, fixed tank capacity and current fuel position</p>
        </div>
        {canWrite && <button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>Add ship</button>}
      </div>
      <ErrorBanner message={error} />
      <div className="flex gap-3">
        <input className="input max-w-sm" placeholder="Search ships" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option><option>At Sea</option><option>At Port</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ship</th><th>Port</th><th>Destination</th><th>Status</th><th>Capacity</th><th>Current fuel</th><th>Required</th><th></th></tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.ship_id}>
                <td className="font-medium">{s.ship_name}</td>
                <td>{s.current_port}</td>
                <td>{s.destination}</td>
                <td><Badge status={s.ship_status}>{s.ship_status}</Badge></td>
                <td>{fmt(s.total_fuel_capacity_mt)}</td>
                <td>{s.current_fuel_mt == null ? '—' : fmt(s.current_fuel_mt)}</td>
                <td>{fmt(s.required_fuel_mt)}</td>
                <td className="space-x-2">
                  <button className="btn-ghost" onClick={() => navigate(`/ships/${s.ship_id}`)}>View</button>
                  {canWrite && <button className="btn-ghost" onClick={() => { setEditing(s.ship_id); setForm({ ...emptyForm, ...s }); setOpen(true); }}>Edit</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <Empty title="No ships match the filter" />}
      </div>
      <Modal open={open} title={editing ? 'Edit ship' : 'Add ship'} onClose={() => setOpen(false)}>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={save}>
          {['ship_name', 'current_port', 'destination', ...(!editing ? ['total_fuel_capacity_mt', 'current_fuel_mt'] : [])].map((k) => (
            <label key={k} className="text-sm capitalize">{k.replaceAll('_', ' ')}
              <input
                className="input mt-1"
                type={['total_fuel_capacity_mt', 'current_fuel_mt'].includes(k) ? 'number' : 'text'}
                min={['total_fuel_capacity_mt', 'current_fuel_mt'].includes(k) ? '0' : undefined}
                step={['total_fuel_capacity_mt', 'current_fuel_mt'].includes(k) ? '0.01' : undefined}
                value={form[k] ?? ''}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={k !== 'current_fuel_mt'}
              />
            </label>
          ))}
          {editing && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900 md:col-span-2"><strong>Capacity locked:</strong> {fmt(form.total_fuel_capacity_mt)} MT total tank capacity.</div>}
          <label className="text-sm">Status
            <select className="input mt-1" value={form.ship_status} onChange={(e) => setForm({ ...form, ship_status: e.target.value })}>
              <option>At Port</option><option>At Sea</option>
            </select>
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" type="submit">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
