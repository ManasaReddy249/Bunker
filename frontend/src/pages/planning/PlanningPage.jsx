import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { Card, Badge, Empty, Loading, ErrorBanner } from '../../components/Ui';
import { fmt, errorMessage } from '../../utils/format';

export default function PlanningPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/planning').then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);
  if (!data && !error) return <Loading />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Fuel Planning</h1>
        <p className="text-sm text-slate-500">{data?.disclaimer}</p>
      </div>
      <ErrorBanner message={error} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Historical consumption">{fmt(data?.summaries?.total_consumed_mt)} MT</Card>
        <Card title="Ships tracked">{data?.summaries?.ships_tracked ?? 0}</Card>
        <Card title="Potential shortages">{data?.summaries?.ships_with_shortage ?? 0}</Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Monthly consumption trend">
          {data?.monthly_trend?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.monthly_trend}>
                <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis /><Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} />
                <Line type="monotone" dataKey="mt" stroke="#087f75" activeDot={{ r: 6, fill: '#066b63' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty title="No history" />}
        </Card>
        <Card title="Ship-wise consumption">
          {data?.ships?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.ships.slice(0, 12)}>
                <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
                <XAxis dataKey="ship_name" hide /><YAxis /><Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} cursor={{ fill: '#eff6f3' }} />
                <Bar dataKey="historical_consumption_mt" fill="#88aaa1" activeBar={{ fill: '#087f75' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty title="No ships" />}
        </Card>
      </div>
      <Card title="Potential shortages and reorder recommendations">
        {(data?.recommendations || []).length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ship</th><th>Current fuel</th><th>Suggested lift</th><th>Nearby vendor</th><th>Note</th></tr></thead>
              <tbody>
                {data.recommendations.map((r) => (
                  <tr key={r.ship_name}>
                    <td>{r.ship_name}</td>
                    <td>{fmt(r.current_fuel_mt)}</td>
                    <td>{fmt(r.required_fuel_mt)}</td>
                    <td>{r.nearby_vendor || '—'}</td>
                    <td className="text-xs text-slate-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No shortage flags" />}
      </Card>
      <Card title="Current availability">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ship</th><th>Status</th><th>Onboard</th><th>Capacity</th><th>Availability</th></tr></thead>
            <tbody>
              {(data?.ships || []).map((s) => (
                <tr key={s.ship_id}>
                  <td>{s.ship_name}</td>
                  <td>{s.ship_status}</td>
                  <td>{s.current_fuel_mt == null ? '—' : fmt(s.current_fuel_mt)}</td>
                  <td>{fmt(s.total_fuel_capacity_mt)}</td>
                  <td><Badge status={s.fuel_availability_label}>{s.fuel_availability_label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
