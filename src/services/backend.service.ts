import { BackendUser } from '../types';

const BASE = '/api/v1';

async function req<T>(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? json.message ?? `HTTP ${res.status}`);
  return json as T;
}

// ── Health ────────────────────────────────────────────────────────────────────

export function pingHealth() {
  return req<{ status: string }>('GET', '/health');
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function register(name: string, email: string, password: string) {
  return req<BackendUser>('POST', '/auth/register', undefined, { name, email, password });
}

export function login(email: string, password: string) {
  return req<{ token: string }>('POST', '/auth/login', undefined, { email, password });
}

// ── Users (authenticated) ─────────────────────────────────────────────────────

export function listUsers(token: string) {
  return req<BackendUser[]>('GET', '/users', token);
}

export function createUser(token: string, name: string, email: string, password: string) {
  return req<BackendUser>('POST', '/users', token, { name, email, password });
}

export function updateUser(token: string, id: string, fields: { name?: string; email?: string }) {
  return req<BackendUser>('PUT', `/users/${id}`, token, fields);
}

export function deleteUser(token: string, id: string) {
  return req<{ message: string }>('DELETE', `/users/${id}`, token);
}
