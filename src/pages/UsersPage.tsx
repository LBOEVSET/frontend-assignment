import { useState, useEffect, useRef } from 'react';
import { DepartmentSummary } from '../types';
import { fetchUsersByDepartment } from '../services/users.service';
import styles from './UsersPage.module.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function UsersPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData]     = useState<Record<string, DepartmentSummary>>({});
  const [error, setError]   = useState('');

  // useRef persists across StrictMode's simulated unmount/remount, so the
  // effect body runs exactly once per real component mount.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    setStatus('loading');
    fetchUsersByDepartment()
      .then(result => { setData(result); setStatus('success'); })
      .catch(err   => { setError(String(err)); setStatus('error'); });
  }, []);

  if (status === 'loading') return <p className={styles.info}>Loading users…</p>;
  if (status === 'error')   return <p className={styles.error}>{error}</p>;
  if (status === 'idle')    return null;

  const departments = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className={styles.wrapper}>
      <p className={styles.subtitle}>
        {departments.length} departments from{' '}
        <a href="https://dummyjson.com/users" target="_blank" rel="noreferrer">
          dummyjson.com/users
        </a>
      </p>

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
    </div>
  );
}
