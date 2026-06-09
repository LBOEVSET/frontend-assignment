import { useState, useEffect, useCallback } from 'react';
import { BackendUser } from '../types';
import * as api from '../services/backend.service';
import css from './BackendPage.module.css';

// ── tiny helpers ──────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register';

interface FormState { name: string; email: string; password: string; }
const empty = (): FormState => ({ name: '', email: '', password: '' });

// ── Auth card ─────────────────────────────────────────────────────────────────

function AuthCard({ onToken }: { onToken: (t: string, e: string) => void }) {
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
        await api.register(form.name, form.email, form.password);
        setOk('Registered! Logging in…');
      }
      const { token } = await api.login(form.email, form.password);
      onToken(token, form.email);
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
          <div className={css.field}>
            <label>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
          </div>
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
        await api.createUser(token, name, email, password);
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
            <div className={css.field}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
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

function UsersSection({ token }: { token: string }) {
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
                <div className={css.userName}>{u.name}</div>
                <div className={css.userEmail}>{u.email}</div>
                <div className={css.userDate}>
                  Created: {new Date(u.created_at).toLocaleString()}
                </div>
              </div>
              <button
                className={css.editBtn}
                onClick={() => { setEditing(u); setCreating(false); }}
              >Edit</button>
              <button
                className={css.deleteBtn}
                onClick={() => handleDelete(u.id)}
              >Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BackendPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleToken = (t: string, e: string) => {
    setToken(t);
    setEmail(e);
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
            <span>Logged in as <strong>{email}</strong></span>
            <button className={css.logoutBtn} onClick={() => { setToken(null); setEmail(''); }}>
              Logout
            </button>
          </div>
          <UsersSection token={token} />
        </>
      )}
    </div>
  );
}
