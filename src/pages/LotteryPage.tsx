import css from './LotteryPage.module.css';

export function LotteryPage() {
  return (
    <div className={css.page}>

      {/* ── Section 1: Architecture ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>1 · System Architecture</div>
        <div className={css.card}>
          <div className={css.arch}>
            <div className={css.archCol}>
              <div className={css.archBox}><div className={css.boxLabel}>User A</div><div className={css.boxSub}>pattern: 1****5</div></div>
              <div className={css.archBox}><div className={css.boxLabel}>User B</div><div className={css.boxSub}>pattern: 1****5</div></div>
              <div className={css.archBox}><div className={css.boxLabel}>User C</div><div className={css.boxSub}>pattern: ****23</div></div>
            </div>
            <div className={css.archArrow}>→</div>
            <div className={css.archCol}>
              <div className={`${css.archBox} ${css.indigo}`}><div className={css.boxLabel}>API Server</div><div className={css.boxSub}>Go / gRPC</div></div>
            </div>
            <div className={css.archArrow}>→</div>
            <div className={css.archCol}>
              <div className={`${css.archBox} ${css.green}`}><div className={css.boxLabel}>Redis</div><div className={css.boxSub}>Bitmap Index</div></div>
              <div className={`${css.archBox} ${css.amber}`}><div className={css.boxLabel}>Redis</div><div className={css.boxSub}>Queue per Pattern</div></div>
            </div>
            <div className={css.archArrow}>→</div>
            <div className={css.archCol}>
              <div className={css.archBox}><div className={css.boxLabel}>PostgreSQL</div><div className={css.boxSub}>Ownership Audit</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Pattern Matching ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>2 · Pattern Matching — Bitmap AND</div>
        <div className={css.card}>
          <div className={css.patternRow}>
            <div className={css.patternInput}>1****5</div>
            <div className={css.stepArrow}>→ parse →</div>
            <div className={css.parseNote}>constrained: <strong>pos[0]=1</strong>, <strong>pos[5]=5</strong></div>
          </div>
          <div className={css.patternRow} style={{ marginTop: 14 }}>
            <div className={css.bitmapGrid}>
              {['1','*','*','*','*','5'].map((d, i) => (
                <div key={i} className={`${css.bitmapCell} ${d !== '*' ? css.bitmapActive : css.bitmapInactive}`}>
                  <span className={css.bitmapPos}>pos {i}</span>
                  {d}
                </div>
              ))}
            </div>
            <div className={css.andOp}>AND</div>
            <div className={css.stepArrow}>→</div>
            <div className={css.resultBox}>&#123; 100005, 100015, 100025… &#125; ~10K matches</div>
          </div>
          <div className={css.patternNote}>
            60 bitmaps (6 positions × 10 digits) · each 125 KB · total index = 7.5 MB · AND in &lt;1 ms
          </div>
        </div>
      </section>

      {/* ── Section 3: Redis Keys ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>3 · Redis Data Layout</div>
        <div className={css.card}>
          <div className={css.redisGrid}>
            {[
              { key: 'bitmap:{pos}:{digit}', desc: '60 bitmaps, each 1M bits.\nUsed for pattern matching via BITOP AND.' },
              { key: 'queue:{pattern}', desc: 'Redis LIST per unique pattern.\nLPOP atomically assigns next ticket.' },
              { key: 'lock:{pattern}', desc: 'SET NX EX 5 — prevents duplicate\nqueue population on first request.' },
              { key: 'reserved:{ticket}', desc: 'SET with TTL (30s). Ticket returns\nto queue if user doesn\'t confirm.' },
            ].map(({ key, desc }) => (
              <div key={key} className={css.redisKey}>
                <div className={css.redisKeyName}>{key}</div>
                <div className={css.redisKeyDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Concurrency ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>4 · Concurrent Assignment — Atomic LPOP</div>
        <div className={css.card}>
          <div className={css.concurrentRow}>
            {[
              { user: 'User A', ticket: '"100005"' },
              { user: 'User B', ticket: '"100015"' },
              { user: 'User C', ticket: '"100025"' },
            ].map(({ user, ticket }) => (
              <div key={user} className={css.userFlow}>
                <div className={css.userLabel}>{user}</div>
                <div className={css.userStep}>LPOP queue:1****5</div>
                <div className={`${css.userStep} ${css.userStepGot}`}>→ {ticket} ✓</div>
              </div>
            ))}
            <div className={css.queueBox}>
              <div className={css.queueTitle}>queue:1****5 (Redis LIST)</div>
              <div className={css.queueBody}>
                {['HEAD → 100005  ← LPOP (User A)', '       100015  ← LPOP (User B)', '       100025  ← LPOP (User C)', '       100035', '       … 9,996 more'].map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          </div>
          <div className={css.returnArc}>
            ↩ TTL expires → background worker RPUSH ticket back to tail of queue
          </div>
        </div>
      </section>

      {/* ── Section 5: State Machine ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>5 · Ticket Lifecycle</div>
        <div className={css.card}>
          <div className={css.states}>
            <div className={`${css.state} ${css.stateAvailable}`}>
              <div className={css.stateName}>Available</div>
              <div className={css.stateSub}>in queue:&#123;pattern&#125;</div>
            </div>
            <div className={css.stateArrow}><div>→</div><div className={css.stateArrowLbl}>LPOP (atomic)</div></div>
            <div className={`${css.state} ${css.stateReserved}`}>
              <div className={css.stateName}>Reserved</div>
              <div className={css.stateSub}>TTL 30s</div>
            </div>
            <div className={css.stateArrow}><div>→</div><div className={css.stateArrowLbl}>User confirms</div></div>
            <div className={`${css.state} ${css.stateAssigned}`}>
              <div className={css.stateName}>Assigned</div>
              <div className={css.stateSub}>PostgreSQL log</div>
            </div>
          </div>
          <div className={css.returnArc}>Reserved → TTL expires → RPUSH back to Available</div>
        </div>
      </section>

      {/* ── Section 6: Performance ── */}
      <section className={css.section}>
        <div className={css.sectionLabel}>6 · Performance Summary</div>
        <div className={css.card}>
          <table className={css.perfTable}>
            <thead>
              <tr><th>Operation</th><th>Complexity</th><th>Latency</th></tr>
            </thead>
            <tbody>
              {[
                ['Bitmap AND (pattern match)', 'O(N/64) ~15K ops', '< 1 ms'],
                ['Cache hit (seen pattern)',   'O(1)',             '< 0.1 ms'],
                ['LPOP (ticket assign)',       'O(1)',             '< 0.2 ms'],
                ['Index build (startup)',      'O(N×6) ~6M ops',  '< 1 s'],
                ['Memory (full index)',        '60 × 125 KB',     '7.5 MB total'],
              ].map(([op, cmp, lat]) => (
                <tr key={op}>
                  <td className={css.mono}>{op}</td>
                  <td>{cmp}</td>
                  <td className={css.fast}>{lat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
