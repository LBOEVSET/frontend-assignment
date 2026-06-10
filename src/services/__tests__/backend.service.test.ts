import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../backend.service';

// ── mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function ok(body: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) });
}
function err(body: unknown, status = 400) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: () => Promise.resolve(body) });
}

beforeEach(() => vi.clearAllMocks());

// ── pingHealth ────────────────────────────────────────────────────────────────

describe('pingHealth', () => {
  it('GETs /api/v1/health and returns status', async () => {
    ok({ status: 'ok' });
    const res = await api.pingHealth();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(res.status).toBe('ok');
  });

  it('throws on non-ok response', async () => {
    err({ error: 'service unavailable' }, 503);
    await expect(api.pingHealth()).rejects.toThrow('service unavailable');
  });
});

// ── register ──────────────────────────────────────────────────────────────────

describe('register', () => {
  it('POSTs to /api/v1/auth/register and returns user', async () => {
    ok({ id: '1', name: 'Alice', email: 'a@b.com', created_at: '2024' });
    const user = await api.register('Alice', 'a@b.com', 'pass123');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(user.name).toBe('Alice');
  });

  it('throws with server error message', async () => {
    err({ error: 'email taken' });
    await expect(api.register('A', 'a@b.com', 'p')).rejects.toThrow('email taken');
  });

  it('throws with message field when error field absent', async () => {
    err({ message: 'bad request' });
    await expect(api.register('A', 'a@b.com', 'p')).rejects.toThrow('bad request');
  });

  it('throws HTTP status fallback when no message', async () => {
    err({}, 422);
    await expect(api.register('A', 'a@b.com', 'p')).rejects.toThrow('HTTP 422');
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns token on success', async () => {
    ok({ token: 'jwt-abc' });
    const res = await api.login('a@b.com', 'pass');
    expect(res.token).toBe('jwt-abc');
  });

  it('includes no Authorization header', async () => {
    ok({ token: 'x' });
    await api.login('a@b.com', 'pass');
    const call = mockFetch.mock.calls[0][1] as RequestInit;
    expect((call.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });
});

// ── listUsers ─────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('GETs /api/v1/users with Bearer token', async () => {
    ok([{ id: '1', name: 'Bob', email: 'b@b.com', created_at: '2024' }]);
    const users = await api.listUsers('my-token');
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe('/api/v1/users');
    expect((call[1].headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(users).toHaveLength(1);
  });
});

// ── createUser ────────────────────────────────────────────────────────────────

describe('createUser', () => {
  it('POSTs user data and returns created user', async () => {
    ok({ id: '2', name: 'Carol', email: 'c@c.com', created_at: '2024' });
    const user = await api.createUser('tok', 'Carol', 'c@c.com', 'pw');
    expect(user.name).toBe('Carol');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/users',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('PUTs to /api/v1/users/:id', async () => {
    ok({ id: '1', name: 'Updated', email: 'a@b.com', created_at: '2024' });
    const user = await api.updateUser('tok', '1', { name: 'Updated' });
    expect(user.name).toBe('Updated');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/users/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  it('DELETEs /api/v1/users/:id', async () => {
    ok({ message: 'deleted' });
    const res = await api.deleteUser('tok', '1');
    expect(res.message).toBe('deleted');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/users/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
