import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAllParticipants, setActiveRunner } from '../lib/firestore';
import type { Participant } from '../lib/types';

export default function AccessGate() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAllParticipants()
      .then((list) => {
        if (cancelled) return;
        list.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const teams = useMemo(
    () => participants.filter((p) => p.type === 'team'),
    [participants],
  );
  const individuals = useMemo(
    () => participants.filter((p) => p.type !== 'team'),
    [participants],
  );

  function openPunchcard(code: string) {
    navigate(`/c/${code}`);
  }

  function openAsMember(code: string, member: string) {
    setActiveRunner(code, member).catch(() => {});
    navigate(`/c/${code}`);
  }

  return (
    <div className="page">
      <div className="header">
        <h1>🏃 QT Quest</h1>
        <p className="subtitle">Race-day punchcard</p>
      </div>

      <div className="card">
        <h2>Find yourself</h2>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Pick your team, then pick your name — or find your name under
          Individuals.
        </p>

        {loading && <p style={{ fontSize: 14, opacity: 0.75 }}>Loading roster…</p>}

        {!loading && teams.length === 0 && individuals.length === 0 && (
          <p style={{ fontSize: 14, opacity: 0.75 }}>
            No roster loaded yet — check back closer to race day.
          </p>
        )}

        {!loading && teams.length > 0 && (
          <>
            <h3 style={{ marginBottom: 4 }}>Teams</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map((team) => {
                const isOpen = expanded === team.code;
                return (
                  <div key={team.code} className="card" style={{ padding: 12 }}>
                    <button
                      type="button"
                      className="btn small"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setExpanded(isOpen ? null : team.code)}
                    >
                      {isOpen ? '▾' : '▸'} {team.name}
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          marginTop: 8,
                        }}
                      >
                        {team.members.length === 0 ? (
                          <p style={{ fontSize: 13, opacity: 0.7 }}>
                            No members listed yet.
                          </p>
                        ) : (
                          team.members.map((member) => (
                            <button
                              key={member}
                              type="button"
                              className="btn"
                              onClick={() => openAsMember(team.code, member)}
                            >
                              {member}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && individuals.length > 0 && (
          <>
            <h3 style={{ marginTop: 16, marginBottom: 4 }}>Individuals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {individuals.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  className="btn"
                  onClick={() => openPunchcard(p.code)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <a href="/marshal" style={{ textAlign: 'center', fontSize: 14 }}>
        Field Marshal Dashboard →
      </a>
    </div>
  );
}
