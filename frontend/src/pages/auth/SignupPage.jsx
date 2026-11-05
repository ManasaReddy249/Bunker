import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../utils/format';

export default function SignupPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(form); } catch (err) { setError(errorMessage(err, 'Could not create your account')); } finally { setBusy(false); }
  }
  return <div className="auth-shell">
    <section className="auth-story"><div className="brand-lockup"><span className="brand-mark"><Anchor size={22}/></span><span>BunkerSmart</span></div><div><p className="eyebrow">MARITIME FUEL INTELLIGENCE</p><h1>Keep every voyage<br/>moving with clarity.</h1><p className="auth-copy">A calmer way to coordinate fuel requests, monitor operations and stay ahead of the next port call.</p></div><div className="auth-foot"><ShieldCheck size={16}/> Secure role-based workspace</div></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}><p className="eyebrow">GET STARTED</p><h2>Create your account</h2><p className="auth-subcopy">Your workspace is ready as soon as you sign up.</p>
      {error && <div className="form-error">{error}</div>}
      <label className="field-label">Full name or username<input className="input mt-2" autoComplete="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required minLength="2"/></label>
      <label className="field-label">Work email<input className="input mt-2" type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>
      <label className="field-label">Password<input className="input mt-2" type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength="8"/><small>Use at least 8 characters.</small></label>
      <button className="btn-primary w-full" disabled={busy}>{busy?'Creating workspace':'Create account'} <ArrowRight size={16}/></button>
      <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </form></section>
  </div>;
}
