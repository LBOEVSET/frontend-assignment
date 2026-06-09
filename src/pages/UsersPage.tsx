import { useState, useEffect, useRef } from 'react';
import { DepartmentSummary, ApiMeta } from '../types';
import { fetchUsersByDepartment, refreshUsersByDepartment } from '../services/users.service';
import styles from './UsersPage.module.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

function formatAge(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function MetaBar({ meta }: { meta: ApiMeta }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.metaBar}>
      <button className={styles.metaToggle} onClick={() => setOpen(o => !o)}>
        ℹ Cache info {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className={styles.metaPanel}>
          <span><strong>Response time:</strong> {meta.responseTime}ms</span>
          <span>
            <strong>Cached:</strong>{' '}
            <span className={meta.isCached ? styles.yes : styles.no}>
              {meta.isCached ? 'Yes' : 'No (fresh fetch)'}
            </span>
          </span>
          <span>
            <strong>Cache age:</strong>{' '}
            {meta.isCached ? formatAge(meta.cacheAge) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  const [tipVisible, setTipVisible] = useState(false);

  return (
    <div className={styles.refreshRow}>
      <button className={styles.refreshBtn} onClick={onRefresh}>
        ↺ Fetch fresh data
      </button>

      <div className={styles.tipWrap}>
        <button
          className={styles.tipIcon}
          onClick={() => setTipVisible(v => !v)}
          aria-label="What does this do?"
        >
          ?
        </button>
        {tipVisible && (
          <div className={styles.tooltip}>
            Clears both the browser cache and the server-side cache, then
            fetches all users directly from dummyjson.com. Use this to see
            real (uncached) response times.
            <button className={styles.tooltipClose} onClick={() => setTipVisible(false)}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function UsersPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData]     = useState<Record<string, DepartmentSummary>>({});
  const [meta, setMeta]     = useState<ApiMeta | null>(null);
  const [error, setError]   = useState('');
  const started             = useRef(false);

  const load = (fetcher: () => Promise<{ data: Record<string, DepartmentSummary>; meta: ApiMeta }>) => {
    setStatus('loading');
    fetcher()
      .then(res => { setData(res.data); setMeta(res.meta); setStatus('success'); })
      .catch(err => { setError(String(err)); setStatus('error'); });
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load(fetchUsersByDepartment);
  }, []);

  const departments = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.leftCol}>
          <p className={styles.subtitle}>
            {departments.length > 0
              ? `${departments.length} departments from `
              : 'Users by department from '}
            <a href="https://dummyjson.com/users" target="_blank" rel="noreferrer">
              dummyjson.com/users
            </a>
          </p>
          <RefreshButton onRefresh={() => load(refreshUsersByDepartment)} />
        </div>
        {meta && <MetaBar meta={meta} />}
      </div>

      {status === 'loading' && <p className={styles.info}>Loading users…</p>}
      {status === 'error'   && <p className={styles.error}>{error}</p>}

      {status === 'success' && (
        <div className={styles.grid}>
          {departments.map(([dept, summary]) => (
            <article key={dept} className={styles.card}>
              <h3 className={styles.dept}>{dept}</h3>
              <dl className={styles.stats}>
                <dt>Gender</dt>
                <dd>♂ {summary.male} &nbsp; ♀ {summary.female}</dd>

                <dt>Age range</dt>
                <dd>{summary.ageRange}</dd>

                <dt>Hair colours</dt>
                <dd>
                  {Object.entries(summary.hair)
                    .sort(([, a], [, b]) => b - a)
                    .map(([color, count]) => (
                      <span key={color} className={styles.tag}>
                        {color}: {count}
                      </span>
                    ))}
                </dd>

                <dt>Users ({Object.keys(summary.addressUser).length})</dt>
                <dd className={styles.users}>
                  {Object.entries(summary.addressUser).map(([name, postal]) => (
                    <span key={name} className={styles.user}>
                      {name} <code>{postal}</code>
                    </span>
                  ))}
                </dd>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
