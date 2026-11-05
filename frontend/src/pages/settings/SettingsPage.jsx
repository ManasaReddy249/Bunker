import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Ui';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user, demoMode } = useAuth();
  const [meta, setMeta] = useState(null);
  const [health, setHealth] = useState(null);
  useEffect(() => {
    api.get('/meta').then((r) => setMeta(r.data));
    api.get('/health').then((r) => setHealth(r.data)).catch((e) => setHealth({ ok: false, message: e.message }));
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-navy">Settings</h1>
      <Card title="Runtime">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>Signed in as <strong>{user?.username}</strong> ({user?.role})</div>
          <div>Demo mode: <strong>{demoMode ? 'On' : 'Off'}</strong></div>
          <div>API database: {meta?.database}</div>
          <div>SQL server: {meta?.server}</div>
          <div>Health: {health?.ok ? 'OK' : 'Check connection'}</div>
          <div>Mode: {health?.mode}</div>
        </dl>
      </Card>
      <Card title="SQL mode switch">
        <p className="text-sm text-slate-600">Set <code>DEMO_MODE=false</code> in <code>backend/.env</code> to use SQL Server tables without changing the frontend. Demo CSV data is never written automatically into application tables.</p>
      </Card>
    </div>
  );
}
