import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ItemIcon from '../components/ItemIcon';
import { ITEMS } from '../lib/items';
import {
  addNote,
  bumpTrashCount,
  logItem,
  setActiveRunner,
  setStatus,
  subscribeParticipant,
  undoItem,
} from '../lib/firestore';
import type { Participant } from '../lib/types';

function fmtTime(ts: unknown): string {
  if (!ts) return '';
  const d = (ts as { toDate?: () => Date }).toDate
    ? (ts as { toDate: () => Date }).toDate()
    : new Date(ts as string);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function elapsed(start: unknown, end: unknown): string {
  if (!start) return '';
  const toDate = (v: unknown) =>
    (v as { toDate?: () => Date })?.toDate
      ? (v as { toDate: () => Date }).toDate()
      : new Date(v as string);
  const s = toDate(start).getTime();
  const e = end ? toDate(end).getTime() : Date.now();
  const mins = Math.max(0, Math.round((e - s) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Punchcard() {
  const { code = '' } = useParams();
  const [p, setP] = useState<Participant | null | undefined>(undefined);
  const [runnerDraft, setRunnerDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeParticipant(code, setP);
    return unsub;
  }, [code]);

  // Re-render every 30s so the elapsed timer stays live.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const doneCount = useMemo(
    () => (p ? Object.values(p.items).filter(Boolean).length : 0),
    [p],
  );

  if (p === undefined) {
    return (
      <div className="page">
        <p style={{ textAlign: 'center' }}>Loading…</p>
      </div>
    );
  }

  if (p === null) {
    return (
      <div className="page">
        <div className="header">
          <h1>Code not found</h1>
        </div>
        <div className="card">
          <p>
            We couldn't find <b>{code}</b>. Double check the code from your
            sign-up confirmation, or ask a Field Marshal for help.
          </p>
        </div>
        <a href="/" style={{ textAlign: 'center' }}>
          ← Back
        </a>
      </div>
    );
  }

  const isTeam = p.type === 'team';
  const actor = isTeam ? p.activeRunner || '' : p.name;
  const nextStop = p.currentStop;
  const finished = doneCount >= 8;

  async function handleLog(itemKey: string) {
    if (!actor) {
      alert('Pick who is running/eating first.');
      return;
    }
    await logItem(code, itemKey, nextStop, actor);
    if (doneCount + 1 >= 8) {
      await setStatus(code, 'finished');
    }
  }

  async function handleUndo(itemKey: string) {
    if (!p) return;
    if (!confirm('Undo this item? Only do this if it was checked by mistake.')) return;
    await undoItem(code, itemKey, p);
  }

  return (
    <div className="page">
      <div className="header">
        <h1>{p.name}</h1>
        <p className="subtitle">
          {isTeam ? 'Relay team' : 'Individual'} · code {p.code}
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>
            <b>{doneCount}</b> / 8 items
          </span>
          {finished ? (
            <span className="badge ok">FINISHED 🎉</span>
          ) : p.status === 'dq' ? (
            <span className="badge danger">DQ</span>
          ) : p.status === 'tapped_out' ? (
            <span className="badge warn">TAPPED OUT</span>
          ) : (
            <span className="badge warn">Next: QT stop {Math.min(nextStop, 8)}</span>
          )}
        </div>
        <div className="progress-bar">
          <div className="fill" style={{ width: `${(doneCount / 8) * 100}%` }} />
        </div>
        {p.startedAt && (
          <p style={{ fontSize: 13, marginTop: 8, opacity: 0.75 }}>
            Elapsed: {elapsed(p.startedAt, p.finishedAt)}
          </p>
        )}
      </div>

      {isTeam && (
        <div className="card">
          <h2>Who's up?</h2>
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
            Set the teammate currently running/eating before checking off an
            item.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="input"
              value={p.activeRunner || ''}
              onChange={(e) => setActiveRunner(code, e.target.value)}
            >
              <option value="">— select teammate —</option>
              {p.members.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {runnerDraft && <option value={runnerDraft}>{runnerDraft}</option>}
            </select>
          </div>
          {p.members.length === 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="input"
                placeholder="Add teammate name"
                value={runnerDraft}
                onChange={(e) => setRunnerDraft(e.target.value)}
              />
              <button
                className="btn small"
                type="button"
                onClick={() => {
                  if (runnerDraft.trim()) setActiveRunner(code, runnerDraft.trim());
                }}
              >
                Set
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2>Required menu</h2>
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          Eat then run. Pick any unused item at your current stop — all 8
          must end up different.
        </p>
        {ITEMS.map((item) => {
          const log = p.itemLog.find((l) => l.itemKey === item.key);
          const checked = !!p.items[item.key];
          return (
            <div key={item.key} className={`item-row ${checked ? 'checked' : ''}`}>
              <div className="check">{checked ? '✓' : ''}</div>
              <ItemIcon icon={item.icon} />
              <div style={{ flex: 1 }}>
                <div className="label">{item.label}</div>
                <div className="detail">{item.detail}</div>
                {log && (
                  <div className="meta" style={{ textAlign: 'left', marginTop: 4 }}>
                    Stop {log.stop} · {log.by} · {fmtTime(log.at)}
                  </div>
                )}
              </div>
              {checked ? (
                <button className="btn small secondary" onClick={() => handleUndo(item.key)}>
                  Undo
                </button>
              ) : (
                <button className="btn small" onClick={() => handleLog(item.key)}>
                  Log it
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>📸 Reminder</h2>
        <p style={{ fontSize: 14 }}>
          Don't forget your selfie/video proof at each stop — this app
          doesn't store photos, so post/save them yourselves!
        </p>
      </div>

      <div className="card">
        <h2>Bonus trash pickup</h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
          Each piece of trash picked up along the route = time bonus.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn small" onClick={() => bumpTrashCount(code, 1)}>
            + Add
          </button>
          <span>
            <b>{p.trashCount}</b> picked up
          </span>
          {p.trashCount > 0 && (
            <button className="btn small secondary" onClick={() => bumpTrashCount(code, -1)}>
              − Fix
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Notes</h2>
        {p.notes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {p.notes.map((n, i) => (
              <div key={i} className="note">
                {n.text}{' '}
                <span style={{ opacity: 0.6 }}>— {fmtTime(n.at)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="e.g. clerk substituted item"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
          />
          <button
            className="btn small"
            onClick={() => {
              if (noteDraft.trim()) {
                addNote(code, noteDraft.trim(), actor);
                setNoteDraft('');
              }
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {p.status !== 'dq' && (
          <button className="btn small secondary" onClick={() => setStatus(code, 'dq')}>
            Mark DQ
          </button>
        )}
        {p.status !== 'tapped_out' && (
          <button className="btn small secondary" onClick={() => setStatus(code, 'tapped_out')}>
            Tap Out
          </button>
        )}
        {(p.status === 'dq' || p.status === 'tapped_out') && (
          <button className="btn small" onClick={() => setStatus(code, 'in_progress')}>
            Resume
          </button>
        )}
      </div>
    </div>
  );
}
