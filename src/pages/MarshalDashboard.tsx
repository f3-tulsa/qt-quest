import { Fragment, useEffect, useMemo, useState } from 'react';
import ItemIcon from '../components/ItemIcon';
import { buildConsumptionOrder } from '../lib/consumptionOrder';
import { STOPS } from '../lib/items';
import {
  createParticipant,
  getParticipantPrivate,
  listAllParticipants,
} from '../lib/firestore';
import type { Participant, ParticipantPrivate } from '../lib/types';

function statusBadge(p: Participant) {
  const doneCount = Object.values(p.items).filter(Boolean).length;
  if (doneCount >= 8) return <span className="badge ok">Finished</span>;
  if (p.status === 'dq') return <span className="badge danger">DQ</span>;
  if (p.status === 'tapped_out') return <span className="badge warn">Tapped out</span>;
  if (p.status === 'not_started') return <span className="badge warn">Not started</span>;
  return <span className="badge ok">In progress</span>;
}

export default function MarshalDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [privateInfo, setPrivateInfo] = useState<Record<string, ParticipantPrivate | null>>({});

  // New late-entry form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'individual' | 'team'>('individual');
  const [newMembers, setNewMembers] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const list = await listAllParticipants();
      list.sort((a, b) => a.name.localeCompare(b.name));
      setParticipants(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  const stats = useMemo(() => {
    const total = participants.length;
    const finished = participants.filter(
      (p) => Object.values(p.items).filter(Boolean).length >= 8,
    ).length;
    const notStarted = participants.filter((p) => p.status === 'not_started').length;
    return { total, finished, notStarted };
  }, [participants]);

  async function toggleExpand(p: Participant) {
    if (expanded === p.code) {
      setExpanded(null);
      return;
    }
    setExpanded(p.code);
    if (!(p.code in privateInfo)) {
      const info = await getParticipantPrivate(p.code);
      setPrivateInfo((prev) => ({ ...prev, [p.code]: info }));
    }
  }

  async function handleAddLate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;
    await createParticipant({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      type: newType,
      members: newType === 'team'
        ? newMembers.split(',').map((m) => m.trim()).filter(Boolean)
        : [],
    });
    setNewName('');
    setNewCode('');
    setNewMembers('');
    refresh();
  }

  if (!authed) {
    return (
      <div className="page">
        <div className="header">
          <h1>Field Marshal Login</h1>
        </div>
        <form
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === import.meta.env.VITE_MARSHAL_CODE) {
              setAuthed(true);
            } else {
              alert('Incorrect marshal code.');
            }
          }}
        >
          <input
            className="input"
            type="password"
            placeholder="Marshal code"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button className="btn" type="submit">
            Enter
          </button>
        </form>
        <a href="/" style={{ textAlign: 'center' }}>
          ← Back
        </a>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="header">
        <h1>Field Marshal Dashboard</h1>
        <p className="subtitle">Live view of all individuals & teams</p>
      </div>

      <div className="card" style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div>
          <b>{stats.total}</b>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
        </div>
        <div>
          <b>{stats.finished}</b>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Finished</div>
        </div>
        <div>
          <b>{stats.notStarted}</b>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Not started</div>
        </div>
        <button className="btn small" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="card">
        <h2>Roster</h2>
        <table className="dash">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Progress</th>
              <th>Stop</th>
              <th>Status</th>
              <th>Trash</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const done = Object.values(p.items).filter(Boolean).length;
              return (
                <Fragment key={p.code}>
                  <tr
                    onClick={() => toggleExpand(p)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{p.name}</td>
                    <td>{p.code}</td>
                    <td>{done}/8</td>
                    <td>{Math.min(p.currentStop, 8)}</td>
                    <td>{statusBadge(p)}</td>
                    <td>{p.trashCount}</td>
                  </tr>
                  {expanded === p.code && (
                    <tr>
                      <td colSpan={6} style={{ background: 'var(--accent-bg)' }}>
                        <div style={{ padding: 8, fontSize: 13 }}>
                          <div>
                            <b>Active runner:</b> {p.activeRunner || '—'}
                          </div>
                          <div>
                            <b>Members:</b> {p.members.join(', ') || '—'}
                          </div>
                          <div>
                            <b>Emergency contact:</b>{' '}
                            {privateInfo[p.code]?.emergencyContact || 'loading/none'}
                          </div>
                          <div>
                            <b>Medical notes:</b>{' '}
                            {privateInfo[p.code]?.medicalNotes || 'none'}
                          </div>
                          {p.notes.length > 0 && (
                            <div>
                              <b>Notes:</b> {p.notes.map((n) => n.text).join(' · ')}
                            </div>
                          )}
                          <div>
                            <b>Link:</b> /c/{p.code}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Consumption order</h2>
        <p className="card-description">
          Each row shows what a participant consumed at stops 1-8.
        </p>
        {participants.length === 0 ? (
          <p className="empty-state">No participants to compare yet.</p>
        ) : (
          <div className="consumption-table-wrap">
            <table className="consumption-table">
              <thead>
                <tr>
                  <th scope="col">Participant</th>
                  {STOPS.map((stop) => (
                    <th key={stop.stop} scope="col">
                      Stop {stop.stop}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => {
                  const order = buildConsumptionOrder(participant.itemLog ?? []);
                  return (
                    <tr key={participant.code}>
                      <th scope="row">
                        <span>{participant.name}</span>
                        {order.invalidStopCount > 0 && (
                          <span
                            className="data-warning"
                            title={`${order.invalidStopCount} log entries have invalid stop numbers`}
                          >
                            Check log
                          </span>
                        )}
                      </th>
                      {STOPS.map((stop) => {
                        const cell = order.byStop.get(stop.stop);
                        if (!cell) {
                          return (
                            <td key={stop.stop} className="consumption-empty">
                              <span className="sr-only">Not yet consumed</span>
                              <span aria-hidden="true">—</span>
                            </td>
                          );
                        }

                        if (!cell.item) {
                          return (
                            <td key={stop.stop}>
                              <span className="unknown-item">Unknown item</span>
                              {cell.duplicateCount > 1 && (
                                <span className="data-warning">
                                  {cell.duplicateCount} logs
                                </span>
                              )}
                            </td>
                          );
                        }

                        return (
                          <td key={stop.stop}>
                            <div
                              className="consumption-item"
                              title={`${cell.item.label} · ${cell.entry.by}`}
                            >
                              <ItemIcon icon={cell.item.icon} />
                              <span>{cell.item.shortLabel}</span>
                            </div>
                            {cell.duplicateCount > 1 && (
                              <span
                                className="data-warning"
                                title="Multiple consumption entries were recorded for this stop"
                              >
                                {cell.duplicateCount} logs
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>QT Stop order</h2>
        <ol style={{ fontSize: 13, paddingLeft: 20 }}>
          {STOPS.map((s) => (
            <li key={s.stop}>
              {s.label} — {s.address}
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>+ Add late sign-up</h2>
        <form onSubmit={handleAddLate} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="input"
            placeholder="Name / team name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Access code (e.g. XY9Z2)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <select
            className="input"
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'individual' | 'team')}
          >
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </select>
          {newType === 'team' && (
            <input
              className="input"
              placeholder="Members, comma separated"
              value={newMembers}
              onChange={(e) => setNewMembers(e.target.value)}
            />
          )}
          <button className="btn" type="submit">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
