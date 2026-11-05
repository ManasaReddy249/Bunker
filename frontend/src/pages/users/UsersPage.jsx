import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Empty, Loading, ErrorBanner, ConfirmDialog, Modal } from '../../components/Ui';
import { errorMessage } from '../../utils/format';

const ROLES = ['Executive', 'Administrator', 'User Administrator'];

export default function UsersPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'User Administrator';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('All');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Executive', is_active: true });
  const [confirm, setConfirm] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((u) => {
    const match = `${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase());
    return match && (role === 'All' || u.role === role);
  }), [users, q, role]);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/users/${editing}`, form);
      else await api.post('/users', form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">User management</h1>
          <p className="text-sm text-slate-500">{canManage ? 'Manage application accounts and roles.' : 'Read-only directory of application accounts.'} Password hashes are never returned by the API.</p>
        </div>
        {canManage && <button className="btn-primary" onClick={() => { setEditing(null); setForm({ username: '', email: '', password: '', role: 'Executive', is_active: true }); setOpen(true); }}>Add user</button>}
      </div>
      <ErrorBanner message={error} />
      <div className="flex gap-3">
        <input className="input max-w-sm" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={role} onChange={(e) => setRole(e.target.value)}>
          <option>All</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <Card>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Source</th><th>Details</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><Badge status={u.is_active ? 'Approved' : 'Rejected'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td>{u.demo_account ? 'Demo login' : u.imported ? 'Imported (no usable password)' : 'Application'}</td>
                  <td><button className="btn-ghost" onClick={() => setDetail(u)}>View</button></td>
                  {canManage && <td className="space-x-2">
                    <button className="btn-ghost" onClick={() => { setEditing(u.user_id); setForm({ username: u.username, email: u.email, password: '', role: u.role, is_active: u.is_active }); setOpen(true); }}>Edit</button>
                    <button className="btn-ghost" onClick={() => setConfirm(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <Empty title="No users" />}
        </div>
      </Card>
      <Modal open={!!detail} title="User details" onClose={() => setDetail(null)}>
        {detail && (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs font-medium uppercase text-muted">User ID</dt><dd className="mt-1 text-sm text-text">{detail.user_id}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-muted">Status</dt><dd className="mt-1"><Badge status={detail.is_active ? 'Approved' : 'Rejected'}>{detail.is_active ? 'Active' : 'Inactive'}</Badge></dd></div>
            <div><dt className="text-xs font-medium uppercase text-muted">Username</dt><dd className="mt-1 text-sm text-text">{detail.username}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-muted">Email</dt><dd className="mt-1 break-all text-sm text-text">{detail.email}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-muted">Role</dt><dd className="mt-1 text-sm text-text">{detail.role}</dd></div>
            <div><dt className="text-xs font-medium uppercase text-muted">Account source</dt><dd className="mt-1 text-sm text-text">{detail.demo_account ? 'Demo login' : detail.imported ? 'Imported account' : 'Application account'}</dd></div>
          </dl>
        )}
      </Modal>
      <Modal open={open} title={editing ? 'Edit user' : 'Add user'} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          <input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder={editing ? 'New password (optional)' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Change account status"
        text={`Set ${confirm?.username} to ${confirm?.is_active ? 'inactive' : 'active'}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await api.patch(`/users/${confirm.user_id}/status`, { is_active: !confirm.is_active });
            setConfirm(null);
            await load();
          } catch (e) {
            setError(errorMessage(e));
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}
