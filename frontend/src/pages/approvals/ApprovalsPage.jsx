import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Empty, Loading, ErrorBanner, ConfirmDialog } from '../../components/Ui';
import { fmt, money, errorMessage } from '../../utils/format';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const [data, setData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  async function load() {
    try {
      const [a, p] = await Promise.all([api.get('/approvals'), api.get('/purchases')]);
      setData(a.data);
      setPurchases(p.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  useEffect(() => { load(); }, []);

  async function run(fn) {
    try {
      await fn();
      setConfirm(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
      setConfirm(null);
    }
  }

  if (!data && !error) return <Loading />;

  function Table({ rows, action }) {
    if (!rows?.length) return <Empty title="None" />;
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th><th>Ship</th><th>Vendor</th><th>Fuel</th><th>Qty</th><th>Expected cost</th><th>Date</th><th>Status</th><th>Approver</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.request_id}>
                <td>FR-{r.request_id}</td>
                <td>{r.ship_name}</td>
                <td>{r.vendor_name}</td>
                <td>{r.fuel_type}</td>
                <td>{fmt(r.quantity_mt)}</td>
                <td>{money(r.expected_cost)}</td>
                <td>{String(r.request_date).slice(0, 10)}</td>
                <td><Badge status={r.request_status}>{r.request_status}</Badge></td>
                <td>{r.approver_name || '—'}</td>
                <td>{action?.(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Approvals & purchases</h1>
        <p className="text-sm text-slate-500">Review Executive fuel requests and approve or reject them.</p>
      </div>
      <ErrorBanner message={error} />
      <Card title="Pending Executive requests">
        <Table rows={data?.pending} action={isAdmin ? (r) => (
          <div className="flex gap-1">
            <button className="btn-primary" onClick={() => setConfirm({ title: 'Approve request', text: `Approve FR-${r.request_id} and create its purchase order?`, run: () => api.post('/approvals/final', { request_id: r.request_id, decision: 'Approved' }) })}>Approve</button>
            <button className="btn-danger" onClick={() => setConfirm({ title: 'Reject request', text: `Reject FR-${r.request_id}? No purchase order will be created.`, run: () => api.post('/approvals/final', { request_id: r.request_id, decision: 'Rejected' }) })}>Reject</button>
          </div>
        ) : null} />
      </Card>
      <Card title="Approved requests"><Table rows={data?.approved} /></Card>
      <Card title="Rejected requests"><Table rows={data?.rejected} /></Card>
      <Card title="Purchase order history">
        {purchases.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>PO</th><th>Request</th><th>Ship</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td className="font-medium">{p.po_number}</td>
                    <td>FR-{p.request_id}</td>
                    <td>{p.ship_name}</td>
                    <td>{money(p.total_cost)}</td>
                    <td>{String(p.purchase_date).slice(0, 10)}</td>
                    <td><Badge status={p.status}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No purchase orders" />}
      </Card>
      <ConfirmDialog open={!!confirm} title={confirm?.title} text={confirm?.text} onCancel={() => setConfirm(null)} onConfirm={() => run(confirm.run)} />
    </div>
  );
}
