import { DepartmentSummary, ApiMeta } from '../types';

const API_URL = '/api/users/department-summary';
const LS_KEY  = 'users_dept_data_v3';

export interface DepartmentResponse {
  data: Record<string, DepartmentSummary>;
  meta: ApiMeta;
}

// ── localStorage cache (write-only — keeps data available offline) ───────────

function writeCache(data: Record<string, DepartmentSummary>): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore quota errors */ }
}

// ── Singleton promise ─────────────────────────────────────────────────────────
// Always calls the API so meta (responseTime, isCached, cacheAge) is live.
// The server handles caching — the meta tells us whether the server used cache.

let sharedPromise: Promise<DepartmentResponse> | null = null;

function doFetch(force = false): Promise<DepartmentResponse> {
  const url = force ? `${API_URL}?force=true` : API_URL;
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json() as Promise<DepartmentResponse>;
    })
    .then(payload => {
      writeCache(payload.data);
      return payload;
    });
}

export function fetchUsersByDepartment(): Promise<DepartmentResponse> {
  if (sharedPromise) return sharedPromise;
  sharedPromise = doFetch();
  return sharedPromise;
}

/** Bypasses both client singleton and server cache, always returns fresh data. */
export function refreshUsersByDepartment(): Promise<DepartmentResponse> {
  localStorage.removeItem(LS_KEY);
  sharedPromise = doFetch(true);
  return sharedPromise;
}

export { groupByDepartment } from './users.transform';
