import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { Card, Badge, Empty, Loading, ErrorBanner } from '../../components/Ui';
import { fmt, errorMessage } from '../../utils/format';

export default function VendorsPage() {
  const [names, setNames] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(vendor) {
    setLoading(true);
    try {
      const { data: payload } = await api.get('/vendors/comparison', { params: vendor ? { vendor } : {} });
      setData(payload);
      setNames(payload.vendor_names || []);
      setSelected(payload.selected || '');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading && !data) return <Loading />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Historical Vendors</h1>
        <p className="text-sm text-slate-500">Review supplier availability and compare current price quotations by fuel type.</p>
      </div>
      <ErrorBanner message={error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Select vendor">
          <select className="input" value={selected} onChange={(e) => load(e.target.value)}>
            {names.map((n) => <option key={n}>{n}</option>)}
          </select>
        </Card>
        <Card title="Vendor details">
          {data?.details ? (
            <div className="space-y-1 text-sm">
              <div className="text-lg font-semibold text-navy">{data.details.vendor_name}</div>
              <div>Port: {data.details.port}</div>
              {data.details.sample_distance_nm != null && (
                <div className="text-slate-500">{data.details.sample_distance_nm} NM · {data.details.sample_distance_note}</div>
              )}
            </div>
          ) : <Empty title="No vendor offers" />}
        </Card>
        <Card title="Other available vendors">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {(data?.others || []).map((o) => (
              <button key={o.vendor_name} className="block w-full rounded-lg border border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => load(o.vendor_name)}>
                <div className="font-medium">{o.vendor_name}</div>
                <div className="text-xs text-slate-500">{o.port}{o.sample_distance_nm != null ? ` · ${o.sample_distance_nm} NM sample` : ''}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card title={`Price quotations · ${selected || '—'}`}>
        {data?.chart?.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chart}>
              <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
              <XAxis dataKey="fuel_type" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} cursor={{ fill: '#eff6f3' }} />
              <Legend />
              <Bar dataKey="selected_price_per_mt" name={selected || 'Selected vendor'} fill="#087f75" activeBar={{ fill: '#066b63' }} radius={[5, 5, 0, 0]} />
              <Bar dataKey="market_best_price_per_mt" name="Market best offer" fill="#88aaa1" activeBar={{ fill: '#087f75' }} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty title="No price data" />}
      </Card>
      <Card title={`Selected vendor offers — ${selected || '—'}`}>
        {data?.offers?.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fuel Type</th><th>Price per MT (USD)</th><th>Available qty (MT)</th><th>Delivery (hours)</th><th>Availability</th></tr></thead>
              <tbody>
                {data.offers.map((offer) => (
                  <tr key={offer.vendor_offer_id}>
                    <td>{offer.fuel_type}</td>
                    <td>${fmt(offer.price_per_mt)}</td>
                    <td>{fmt(offer.available_quantity_mt)}</td>
                    <td>{offer.delivery_time_hours}</td>
                    <td><Badge status={offer.status}>{offer.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="This vendor has no offers" />}
      </Card>
      <Card title="Best available offer by fuel type">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fuel Type</th><th>Vendor</th><th>Port</th><th>Price per MT (USD)</th><th>Available qty (MT)</th><th>Delivery (hours)</th><th>Availability</th></tr></thead>
            <tbody>
              {(data?.fuel_offers || []).map((o) => (
                <tr key={o.fuel_type}>
                  <td>{o.fuel_type}</td>
                  <td>{o.vendor_name || '—'}</td>
                  <td>{o.port || '—'}</td>
                  <td>{o.vendor_offer_id ? `$${fmt(o.price_per_mt)}` : '—'}</td>
                  <td>{o.vendor_offer_id ? fmt(o.available_quantity_mt) : '—'}</td>
                  <td>{o.vendor_offer_id ? o.delivery_time_hours : '—'}</td>
                  <td>{o.vendor_offer_id ? <Badge status={o.status}>{o.status}</Badge> : <Badge status="Unavailable">No offer</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
