import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import type { Participant } from '../types';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

export default function Status() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);

  const load = useCallback(async () => {
    if (!workshopId) return;
    try {
      const data = await api.getParticipants(workshopId);
      setParticipants(data);
    } catch {
      // silently ignore polling errors
    }
  }, [workshopId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const sent = participants.filter(p => p.email_status === 'sent').length;
  const failed = participants.filter(p => p.email_status === 'failed').length;
  const pending = participants.filter(p => p.email_status === 'pending').length;

  async function retry(id: string) {
    try {
      await api.retryEmail(id);
      void load();
    } catch {
      // silently ignore
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: 48 }}>
      <StepNav current={5} />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 40px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Step 06
          </p>
          <h1 style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
            Status
          </h1>
        </div>

        {/* Stat counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1a1a1a', marginBottom: 48 }}>
          {[
            { label: 'Sent', count: sent, color: '#4ade80' },
            { label: 'Pending', count: pending, color: '#fff' },
            { label: 'Failed', count: failed, color: '#f87171' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ background: '#000', padding: '28px 32px' }}>
              <div style={{ fontFamily: F.plaak, fontSize: 36, letterSpacing: '0.02em', color, marginBottom: 6 }}>{count}</div>
              <div style={{ fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Failed retry section */}
        {failed > 0 && (
          <div style={{ marginBottom: 32, borderLeft: '2px solid #f87171', paddingLeft: 24 }}>
            <div style={{ fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f87171', marginBottom: 16 }}>
              Failed — click to retry
            </div>
            {participants.filter(p => p.email_status === 'failed').map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #111' }}>
                <div>
                  <span style={{ fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>{p.full_name}</span>
                  {p.email_error && (
                    <span style={{ fontFamily: F.riforma, fontSize: 12, color: '#fff', marginLeft: 12 }}>{p.email_error}</span>
                  )}
                </div>
                <button
                  onClick={() => { void retry(p.id); }}
                  style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 16px', cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Full table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222' }}>
              {['#', 'Full Name', 'Email', 'Company', 'Status'].map((h, i) => (
                <th key={i} style={{
                  fontFamily: F.riforma, fontSize: 10, fontWeight: 400, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#fff', textAlign: 'left',
                  padding: '0 20px 14px 0', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #111' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 20px 12px 0', fontFamily: F.riforma, fontSize: 12, color: '#fff', width: 32, verticalAlign: 'middle' }}>{idx + 1}</td>
                <td style={{ padding: '12px 20px 12px 0', fontFamily: F.riforma, fontSize: 13, color: '#fff', verticalAlign: 'middle', minWidth: 160 }}>{p.full_name}</td>
                <td style={{ padding: '12px 20px 12px 0', fontFamily: F.riforma, fontSize: 13, color: '#fff', verticalAlign: 'middle', minWidth: 180 }}>{p.email ?? '—'}</td>
                <td style={{ padding: '12px 20px 12px 0', fontFamily: F.riforma, fontSize: 13, color: '#fff', verticalAlign: 'middle', minWidth: 140 }}>{p.company}</td>
                <td style={{ padding: '12px 0', verticalAlign: 'middle' }}>
                  <span style={{
                    fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#000',
                    background: p.email_status === 'sent' ? '#4ade80' : p.email_status === 'failed' ? '#f87171' : '#555',
                    padding: '4px 10px', display: 'inline-block',
                  }}>
                    {p.email_status ?? 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
