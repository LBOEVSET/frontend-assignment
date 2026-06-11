import { useState, useEffect, useCallback } from 'react';
import { BackendUser } from '../types';
import * as api from '../services/backend.service';
import css from './BackendPage.module.css';

// ── tiny helpers ──────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register';

interface FormState { name: string; email: string; password: string; role: string; }
const empty = (): FormState => ({ name: '', email: '', password: '', role: 'user' });

// ── Auth card ─────────────────────────────────────────────────────────────────

function AuthCard({ onToken }: { onToken: (t: string, e: string, r: string) => void }) {
  const [mode, setMode]     = useState<AuthMode>('login');
  const [form, setForm]     = useState<FormState>(empty());
  const [busy, setBusy]     = useState(false);
  const [err,  setErr]      = useState('');
  const [ok,   setOk]       = useState('');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr(''); setOk('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await api.register(form.name, form.email, form.password, form.role);
        setOk('Registered! Logging in…');
      }
      const { token, role } = await api.login(form.email, form.password);
      onToken(token, form.email, role);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={css.authCard}>
      <div className={css.authTabs}>
        <button
          className={`${css.authTab} ${mode === 'login' ? css['authTab--active'] : ''}`}
          onClick={() => { setMode('login'); setErr(''); setOk(''); }}
        >Login</button>
        <button
          className={`${css.authTab} ${mode === 'register' ? css['authTab--active'] : ''}`}
          onClick={() => { setMode('register'); setErr(''); setOk(''); }}
        >Register</button>
      </div>

      <form className={css.form} onSubmit={submit}>
        {mode === 'register' && (
          <>
            <div className={css.field}>
              <label>Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
            </div>
            <div className={css.field}>
              <label htmlFor="auth-role-user">Role</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    id="auth-role-user"
                    type="radio"
                    name="role"
                    value="user"
                    checked={form.role === 'user'}
                    onChange={set('role')}
                  /><span>User</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={form.role === 'admin'}
                    onChange={set('role')}
                  /><span>Admin</span>
                </label>
              </div>
            </div>
          </>
        )}
        <div className={css.field}>
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" required />
        </div>
        <div className={css.field}>
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
        </div>

        {err && <p className={css.error}>{err}</p>}
        {ok  && <p className={css.success}>{ok}</p>}

        <button className={css.submitBtn} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  );
}

// ── Inline create / edit form ─────────────────────────────────────────────────

interface UserFormProps {
  initial?: BackendUser;
  token: string;
  onSave: () => void;
  onCancel: () => void;
}

function UserForm({ initial, token, onSave, onCancel }: UserFormProps) {
  const [name,     setName]     = useState(initial?.name ?? '');
  const [email,    setEmail]    = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('user');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (initial) {
        await api.updateUser(token, initial.id, { name, email });
      } else {
        await api.createUser(token, name, email, password, role);
      }
      onSave();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={css.formCard}>
      <h4>{initial ? 'Edit user' : 'Create user'}</h4>
      <form onSubmit={submit}>
        <div className={css.formRow}>
          <div className={css.field}>
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={css.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {!initial && (
            <>
              <div className={css.field}>
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className={css.field}>
                <label htmlFor="form-role-user">Role</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input id="form-role-user" type="radio" name="create-role" value="user"
                      checked={role === 'user'} onChange={e => setRole(e.target.value)} /><span>User</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="create-role" value="admin"
                      checked={role === 'admin'} onChange={e => setRole(e.target.value)} /><span>Admin</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
        {err && <p className={css.error}>{err}</p>}
        <div className={css.formActions}>
          <button className={css.submitBtn} type="submit" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create'}
          </button>
          <button className={css.cancelBtn} type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Users section (requires token) ───────────────────────────────────────────

interface UsersSectionProps {
  readonly token: string;
  readonly email: string;
  readonly callerRole: string;
}

function UsersSection({ token, email, callerRole }: UsersSectionProps) {
  const [users,    setUsers]    = useState<BackendUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState('');
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<BackendUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const data = await api.listUsers(token);
      setUsers(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.deleteUser(token, id);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  /**
   * canMutate returns true when the logged-in user is allowed to edit/delete a row.
   *   self  → always allowed (any role can edit their own account)
   *   admin → can touch any other user whose role is NOT admin
   *   user  → can only touch their own row (covered by self check above)
   */
  const canMutate = (u: BackendUser) => {
    if (u.email === email) return true;          // self-edit always allowed
    if (callerRole === 'admin') return u.role !== 'admin';
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={css.sectionHeader}>
        <h3 className={css.sectionTitle}>Users ({users.length})</h3>
        <button className={css.addBtn} onClick={() => { setCreating(true); setEditing(null); }}>
          + Add user
        </button>
      </div>

      {creating && (
        <UserForm
          token={token}
          onSave={() => { setCreating(false); load(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {editing && (
        <UserForm
          initial={editing}
          token={token}
          onSave={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {err     && <p className={css.error}>{err}</p>}
      {loading && <p className={css.emptyState}>Loading…</p>}

      {!loading && !err && (
        <div className={css.userList}>
          {users.length === 0 && (
            <p className={css.emptyState}>No users yet. Create one above.</p>
          )}
          {users.map(u => (
            <div key={u.id} className={css.userRow}>
              <div className={css.userInfo}>
                <div className={css.userName}>
                  {u.name}
                  <span style={{
                    marginLeft: 8,
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: u.role === 'admin' ? '#1a1a2e' : '#e8f4fd',
                    color: u.role === 'admin' ? '#fff' : '#2563eb',
                    fontWeight: 600,
                  }}>
                    {u.role ?? 'user'}
                  </span>
                </div>
                <div className={css.userEmail}>{u.email}</div>
                <div className={css.userDate}>
                  Created: {new Date(u.created_at).toLocaleString()}
                </div>
              </div>
              {canMutate(u) && (
                <>
                  <button
                    className={css.editBtn}
                    onClick={() => { setEditing(u); setCreating(false); }}
                  >Edit</button>
                  <button
                    className={css.deleteBtn}
                    onClick={() => handleDelete(u.id)}
                  >Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'backend_token';
const EMAIL_KEY = 'backend_email';
const ROLE_KEY  = 'backend_role';

export function BackendPage() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) ?? '');
  const [role,  setRole]  = useState(() => sessionStorage.getItem(ROLE_KEY) ?? 'user');

  const handleToken = (t: string, e: string, r: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    sessionStorage.setItem(EMAIL_KEY, e);
    sessionStorage.setItem(ROLE_KEY, r);
    setToken(t);
    setEmail(e);
    setRole(r);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setToken(null);
    setEmail('');
    setRole('user');
  };

  return (
    <div className={css.wrapper}>
      <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1a2e' }}>
        Backend API — User Management
      </h2>

      {!token ? (
        <AuthCard onToken={handleToken} />
      ) : (
        <>
          <div className={css.sessionBar}>
            <span>
              Logged in as <strong>{email}</strong>
              <span style={{
                marginLeft: 8,
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: 4,
                background: role === 'admin' ? '#1a1a2e' : '#e8f4fd',
                color: role === 'admin' ? '#fff' : '#2563eb',
                fontWeight: 600,
              }}>
                {role}
              </span>
            </span>
            <button className={css.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
          <UsersSection token={token} email={email} callerRole={role} />
        </>
      )}
    </div>
  );
}
