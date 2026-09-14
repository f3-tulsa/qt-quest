import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessGate() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  function go(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    navigate(`/c/${trimmed}`);
  }

  return (
    <div className="page">
      <div className="header">
        <h1>🏃 QT Quest</h1>
        <p className="subtitle">Race-day punchcard</p>
      </div>

      <form className="card" onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Enter your access code</h2>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Find your code / link in the sign-up confirmation. One code per
          person (individuals) or per team (relay teams share one code).
        </p>
        <input
          className="input"
          placeholder="e.g. ABC123"
          value={code}
          autoCapitalize="characters"
          autoFocus
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn" type="submit">
          Open my punchcard
        </button>
      </form>

      <a href="/marshal" style={{ textAlign: 'center', fontSize: 14 }}>
        Field Marshal Dashboard →
      </a>
    </div>
  );
}
