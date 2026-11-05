import { useState } from 'react';
import api from '../../services/api';
import { Card, Empty, ErrorBanner } from '../../components/Ui';
import { downloadCsv, errorMessage } from '../../utils/format';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tab, setTab] = useState('consumption');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load(nextTab = tab) {
    setError('');
    try {
      if (nextTab === 'consumption') {
        const { data } = await api.get('/reports/consumption', { params: { from, to } });
        setRows(data.rows || []);
      } else if (nextTab === 'purchases') {
        const { data } = await api.get('/reports/purchases', { params: { from, to } });
        setRows(data.rows || []);
      } else {
        const { data } = await api.get('/reports/inventory');
        if (nextTab === 'inventory') setRows(data.inventory || []);
        if (nextTab === 'allocations') setRows(data.allocations || []);
        if (nextTab === 'pending') setRows(data.pending_requests || []);
        if (nextTab === 'vendors') setRows(data.vendor_prices || []);
      }
      setTab(nextTab);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Reports</h1>
        <p className="text-sm text-slate-500">Review fleet and fuel performance in one view, with CSV export for further analysis.</p>
      </div>
      <ErrorBanner message={error} />
      <Card>
        <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          <input className="input max-w-xs" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="input max-w-xs" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          {['consumption', 'purchases', 'inventory', 'allocations', 'pending', 'vendors'].map((t) => (
            <button key={t} className={`${tab === t ? 'btn-primary' : 'btn-ghost'} shrink-0 capitalize`} onClick={() => load(t)}>{t}</button>
          ))}
          <button className="btn-ghost" onClick={() => downloadCsv(`bunkersmart-${tab}.csv`, rows)}>Export CSV</button>
        </div>
      </Card>
      <Card title={`Report: ${tab}`}>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>{Object.keys(rows[0]).slice(0, 8).map((k) => <th key={k}>{k}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>{Object.keys(rows[0]).slice(0, 8).map((k) => <td key={k}>{typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k] ?? '')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Run a report to see rows" />}
      </Card>
    </div>
  );
}
