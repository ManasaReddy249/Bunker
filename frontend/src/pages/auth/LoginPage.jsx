import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../utils/format';

const ACCOUNTS = [
  ['admin', 'Admin@123', 'Administrator'],
  ['useradmin', 'UserAdmin@123', 'User Administrator'],
  ['executive', 'Executive@123', 'Executive']
];

export default function LoginPage() {
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(loginValue, password);
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-story">
        <div className="flex items-center gap-3">
          <span className="brand-mark"><Anchor /></span>
          <span className="text-xl font-semibold">BunkerSmart</span>
        </div>
        <div>
          <p className="eyebrow">MARITIME FUEL INTELLIGENCE</p>
          <h1>Fuel operations,<br/>in clear view.</h1>
          <p className="auth-copy">Plan smarter, compare supplier quotations and keep your fleet supplied at every port call.</p>
        </div>
        <p className="text-sm text-white/50">Fuel Management System</p>
      </div>
      <div className="auth-panel">
        <form onSubmit={submit} className="auth-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2 className="text-2xl font-semibold text-navy">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Use a demo account or a SQL user with a bcrypt password.</p>
          {error && <div className="mb-4 rounded-lg bg-status-invalid/10 px-3 py-2 text-sm text-status-invalid">{error}</div>}
          <label className="mb-3 block text-sm font-medium">Username or email
            <input className="input mt-1" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} required />
          </label>
          <label className="mb-4 block text-sm font-medium">Password
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="auth-switch">New to BunkerSmart? <Link to="/signup">Create an account</Link></p>
          <div className="mt-6 text-xs text-slate-500">
            <div className="mb-2 font-semibold text-slate-700">Demo accounts</div>
            {ACCOUNTS.map(([u, p, r]) => (
              <button key={u} type="button" className="mb-1 block w-full rounded-md px-2 py-1 text-left hover:bg-slate-50" onClick={() => { setLoginValue(u); setPassword(p); }}>
                <span className="font-medium text-navy">{u}</span> / {p} — {r}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
