/**
 * Frontend data-access layer for Part 2 — Users by Department.
 *
 * Calls our own TypeScript API server (Express / gRPC) instead of dummyjson
 * directly.  In development, Vite proxies /api/users/* → http://localhost:3001.
 * In production the Ingress routes /api/* to the API server.
 *
 * Client-side caching strategy:
 *   1. Check localStorage (TTL 1 hr) — avoids a round-trip after a page refresh.
 *   2. Check the in-memory singleton promise — prevents duplicate in-flight calls
 *      including React StrictMode's double-invoke of useEffect.
 *   3. Fetch from the API server — the server itself caches the dummyjson data.
 */

import { DepartmentSummary } from '../types';

const API_URL  = '/api/users/department-summary';
const LS_KEY   = 'users_dept_summary_v2';
const TTL_MS   = 60 * 60 * 1000; // 1 hour

// ── localStorage cache ────────────────────────────────────────────────────────

function readCache(): Record<string, DepartmentSummary> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { data, ts }: { data: Record<string, DepartmentSummary>; ts: number } =
      JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: Record<string, DepartmentSummary>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Ignore quota errors — in-memory singleton still works.
  }
}

// ── Singleton promise ─────────────────────────────────────────────────────────

let sharedPromise: Promise<Record<string, DepartmentSummary>> | null = null;

export function fetchUsersByDepartment(): Promise<Record<string, DepartmentSummary>> {
  if (sharedPromise) return sharedPromise;

  const cached = readCache();
  if (cached) {
    sharedPromise = Promise.resolve(cached);
    return sharedPromise;
  }

  sharedPromise = fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json() as Promise<Record<string, DepartmentSummary>>;
    })
    .then(data => {
      writeCache(data);
      return data;
    });

  return sharedPromise;
}

/**
 * groupByDepartment is kept here (exported) for unit-testing the transform
 * logic in isolation.  At runtime the server performs the transformation and
 * returns the already-grouped JSON, so this function is not called in
 * production.
 */
export { groupByDepartment } from './users.transform';
