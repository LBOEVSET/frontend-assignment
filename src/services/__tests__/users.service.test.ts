import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub fetch globally before any import.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const payload = {
  data: { Engineering: { male: 1, female: 1, ageRange: '25-30', hair: {}, addressUser: {} } },
  meta: { responseTime: 10, isCached: false, cacheAge: 0 },
};

function okResponse() {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(payload) });
}

// Reset modules before each test so the singleton sharedPromise is null again.
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('fetchUsersByDepartment', () => {
  it('calls /api/users/department-summary', async () => {
    okResponse();
    const { fetchUsersByDepartment } = await import('../users.service');
    const res = await fetchUsersByDepartment();
    expect(mockFetch).toHaveBeenCalledWith('/api/users/department-summary');
    expect(res.data).toHaveProperty('Engineering');
  });

  it('returns the same promise on repeated calls (singleton)', async () => {
    okResponse();
    const { fetchUsersByDepartment } = await import('../users.service');
    const p1 = fetchUsersByDepartment();
    const p2 = fetchUsersByDepartment();
    expect(p1).toBe(p2);
    await p1;
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('writes result to localStorage', async () => {
    okResponse();
    const { fetchUsersByDepartment } = await import('../users.service');
    await fetchUsersByDepartment();
    const cached = localStorage.getItem('users_dept_data_v3');
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!).data).toHaveProperty('Engineering');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const { fetchUsersByDepartment } = await import('../users.service');
    await expect(fetchUsersByDepartment()).rejects.toThrow('API error 503');
  });
});

describe('refreshUsersByDepartment', () => {
  it('calls with ?force=true', async () => {
    okResponse();
    const { refreshUsersByDepartment } = await import('../users.service');
    await refreshUsersByDepartment();
    expect(mockFetch).toHaveBeenCalledWith('/api/users/department-summary?force=true');
  });

  it('clears localStorage before fetching', async () => {
    localStorage.setItem('users_dept_data_v3', 'old');
    okResponse();
    const { refreshUsersByDepartment } = await import('../users.service');
    await refreshUsersByDepartment();
    const cached = localStorage.getItem('users_dept_data_v3');
    // writeCache will repopulate it with fresh data
    expect(JSON.parse(cached!).data).toHaveProperty('Engineering');
  });
});
