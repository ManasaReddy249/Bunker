import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Anchor, Fuel, Warehouse, ClipboardList, CheckSquare, Users, FileBarChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Kpi, Loading, Empty, Badge, ErrorBanner } from '../../components/Ui';
import { fmt, errorMessage } from '../../utils/format';

const COLORS = ['#087f75', '#88aaa1', '#21836f', '#bb8436', '#bf5b59'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary').then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    if (user?.role === 'User Administrator') api.get('/users').then((r) => setUsers(r.data.slice(0, 8))).catch((e) => setError(errorMessage(e)));
  }, [user?.role]);

  if (!data && !error) return <Loading />;
  const k = data?.kpis || {};
  const m = data?.role_metrics || {};
  const isAdmin = user?.role === 'Administrator';
  const isUserAdmin = user?.role === 'User Administrator';
  const isExecutive = user?.role === 'Executive';
  const roleTitle = isAdmin ? 'Fuel Administrator' : isUserAdmin ? 'User Administrator' : 'Executive';
  const metrics = isAdmin ? [
    { icon: CheckSquare, label: 'Pending approvals', value: m.pending_approvals ?? 0, tone: 'orange', to: '/approvals' },
    { icon: Ship, label: 'Fleet ships', value: k.total_ships ?? 0, tone: 'blue', to: '/ships' },
    { icon: Fuel, label: 'Available vendor offers', value: m.available_vendor_offers ?? 0, tone: 'green', to: '/vendors' },
    { icon: Warehouse, label: 'Low-stock items', value: m.low_stock_items ?? 0, tone: 'red', to: '/workspace' }
  ] : isUserAdmin ? [
    { icon: Users, label: 'Active user accounts', value: m.active_users ?? 0, tone: 'blue', to: '/users' },
    { icon: Users, label: 'Executive accounts', value: users.filter((u)=>u.role === 'Executive').length, tone: 'green', to: '/users' },
    { icon: Users, label: 'Inactive accounts', value: users.filter((u)=>!u.is_active).length, tone: 'navy', to: '/users' }
  ] : [
    { icon: ClipboardList, label: 'My fuel requests', value: m.my_requests ?? 0, tone: 'blue', to: '/requests' },
    { icon: CheckSquare, label: 'Awaiting Admin', value: m.my_pending_requests ?? 0, tone: 'orange', to: '/requests' },
    { icon: FileBarChart, label: 'Approved requests', value: m.my_approved_requests ?? 0, tone: 'green', to: '/requests' },
    { icon: Fuel, label: 'Available vendor offers', value: m.available_vendor_offers ?? 0, tone: 'navy', to: '/vendors' }
  ];
  const shortcuts = isAdmin ? [
    { title: 'Review pending requests', text: 'Approve or reject Executive submissions', to: '/approvals', tone: 'bg-status-invalid/10' },
    { title: 'Vendor pricing', text: 'Review fuel offers and availability', to: '/vendors', tone: 'bg-primary/10' }
  ] : isUserAdmin ? [
    { title: 'Manage people and access', text: 'Review accounts, roles and account status', to: '/users', tone: 'bg-primary/10' },
    { title: 'New account requests', text: 'Review user roles and account status', to: '/users', tone: 'bg-status-valid/10' }
  ] : [
    { title: 'Create fuel request', text: 'Select a ship and vendor offer', to: '/requests', tone: 'bg-primary/10' },
    { title: 'Compare vendor offers', text: 'Review fuel types and pricing', to: '/vendors', tone: 'bg-status-valid/10' }
  ];

  return (
    <div className="space-y-5">
      {isUserAdmin ? <>
        <div><p className="eyebrow">PEOPLE & ACCESS</p><h1 className="text-2xl font-semibold text-navy">User Administration</h1><p className="text-sm text-slate-500">Manage account access, assigned roles and user status.</p></div>
        <ErrorBanner message={error} />
        <div className="grid gap-4 sm:grid-cols-2"><Kpi icon={Users} label="Active accounts" value={users.filter((u)=>u.is_active).length} tone="blue" onClick={()=>navigate('/users')}/><Kpi icon={Users} label="Registered accounts" value={data?.role_metrics?.active_users ?? users.length} tone="green" onClick={()=>navigate('/users')}/></div>
        <Card title="Recently available accounts" action={<button className="btn-primary" onClick={()=>navigate('/users')}>Manage users</button>}>
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th></tr></thead><tbody>{users.map((u)=><tr key={u.user_id}><td className="font-medium">{u.username}</td><td>{u.email}</td><td>{u.role}</td><td><Badge status={u.is_active?'Available':'Unavailable'}>{u.is_active?'Active':'Inactive'}</Badge></td></tr>)}</tbody></table>{!users.length&&<Empty title="No user accounts found"/>}</div>
        </Card>
      </> : <>
      <div>
          <h1 className="text-2xl font-semibold text-navy">{roleTitle} Dashboard</h1>
        <p className="text-sm text-slate-500">{isAdmin ? 'Fuel supply, approvals, inventory and fleet operations' : isUserAdmin ? 'Accounts, access and organization oversight' : `Welcome, ${user?.username}. Track your requests and vendor offers.`}</p>
      </div>
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <Kpi key={metric.label} {...metric} onClick={() => navigate(metric.to)} />
        ))}
      </div>
      {!isUserAdmin && <div className="grid gap-4 lg:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <button key={shortcut.title} className={`group rounded-xl border border-white/80 ${shortcut.tone} p-5 text-left text-navy shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`} onClick={() => navigate(shortcut.to)}>
            <div className="text-lg font-semibold">{shortcut.title}</div>
            <div className="mt-1 text-sm text-slate-600">{shortcut.text}</div>
          </button>
        ))}
      </div>}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title={isExecutive ? 'My request pipeline' : 'Fleet fuel consumption (MT)'} className="xl:col-span-1">
          {isExecutive ? (data?.request_status_distribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.request_status_distribution}>
                <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
                <XAxis dataKey="status" hide />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} cursor={{ fill: '#eff6f3' }} />
                <Bar dataKey="count" fill="#087f75" activeBar={{ fill: '#066b63' }} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty title="No requests yet" />) : data?.consumption_trend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.consumption_trend}>
                <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} />
                <Line type="monotone" dataKey="mt" stroke="#087f75" strokeWidth={3} activeDot={{ r: 6, fill: '#066b63' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty title="No consumption history" />}
        </Card>
        <Card title={isExecutive ? 'Fleet inventory by fuel type' : 'Inventory by fuel type'}>
          {data?.inventory_distribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.inventory_distribution} dataKey="mt" nameKey="fuel_type" outerRadius={80} label>
                  {data.inventory_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty title="No inventory records" />}
        </Card>
        <Card title={isExecutive ? 'My recent requests' : 'Monthly purchase trend (USD)'}>
          {isExecutive ? (data?.recent_requests?.length ? (
            <div className="space-y-2">
              {data.recent_requests.slice(0, 5).map((request) => (
                <button key={request.request_id} type="button" className="flex w-full items-center justify-between rounded-lg bg-chart-hover px-3 py-2 text-left transition hover:bg-primary/10" onClick={() => navigate('/requests')}>
                  <span className="text-sm font-medium text-navy">FR-{request.request_id} · {request.ship_name}</span>
                  <Badge status={request.request_status}>{request.request_status}</Badge>
                </button>
              ))}
            </div>
          ) : <Empty title="No requests yet" />) : data?.purchase_trend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.purchase_trend}>
                <CartesianGrid stroke="#e0eae7" strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#eff6f3', borderColor: '#dce8e5', borderRadius: 8 }} cursor={{ fill: '#eff6f3' }} />
                <Bar dataKey="usd" fill="#88aaa1" activeBar={{ fill: '#087f75' }} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty title="No approved purchases" />}
        </Card>
      </div>
      {!isExecutive && <Card title={isAdmin ? 'Fleet oversight' : 'Fleet portfolio'} action={<button className="btn-ghost" onClick={() => navigate('/ships')}>View all</button>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ship Name</th><th>Current Port</th><th>Destination</th><th>Fuel Type</th>
                <th>Current Fuel (MT)</th><th>Required Fuel (MT)</th><th>Fuel Availability</th><th>Nearby Vendor</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.ship_overview || []).slice(0, 8).map((s) => (
                <tr key={s.ship_id}>
                  <td className="font-medium">{s.ship_name}</td>
                  <td>{s.current_port}</td>
                  <td>{s.destination}</td>
                  <td>{s.nearby_fuel_type || '—'}</td>
                  <td>{s.current_fuel_mt == null ? '—' : fmt(s.current_fuel_mt)}</td>
                  <td>{fmt(s.required_fuel_mt)}</td>
                  <td><Badge status={s.fuel_availability_label}>{s.fuel_availability_label}{s.current_fuel_mt != null ? ` ${s.fuel_availability_pct}%` : ''}</Badge></td>
                  <td>
                    {s.nearby_vendor || '—'}
                    {s.sample_distance_nm != null && (
                      <div className="text-xs text-slate-400">{s.sample_distance_nm} NM sample (demo)</div>
                    )}
                  </td>
                  <td><button className="btn-ghost" onClick={() => navigate(`/ships/${s.ship_id}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.ship_overview?.length && <Empty title="No ships in the database yet" />}
        </div>
      </Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={isAdmin ? 'Requests awaiting fuel review' : 'My request activity'}>
          {(isAdmin ? data?.pending_requests : data?.recent_requests)?.length ? (
            <div className="space-y-2">
              {(isAdmin ? data.pending_requests : data.recent_requests).map((r) => (
                <div key={r.request_id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <div className="font-medium">FR-{r.request_id} · {r.ship_name}</div>
                    <div className="text-xs text-slate-500">{r.fuel_type} · {fmt(r.quantity_mt)} MT</div>
                  </div>
                  <Badge status={r.request_status}>{r.request_status}</Badge>
                </div>
              ))}
            </div>
          ) : <Empty title="No purchase requests" />}
        </Card>
        {!isExecutive && <Card title="Low-stock alerts">
          {(data?.low_stock || []).length ? data.low_stock.map((i) => (
            <div key={i.inventory_id} className="mb-2 flex justify-between rounded-lg bg-status-invalid/10 px-3 py-2 text-sm">
              <span>{i.port} · {i.fuel_type}</span>
              <span className="font-semibold text-status-invalid">{fmt(i.available_quantity_mt)} MT</span>
            </div>
          )) : <Empty title="No low-stock alerts" text="Alerts appear when available stock is at or below reorder level." />}
        </Card>}
      </div>
      </>}
    </div>
  );
}
