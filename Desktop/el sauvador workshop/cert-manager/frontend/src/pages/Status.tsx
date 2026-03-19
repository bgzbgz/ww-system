import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import type { Participant } from '../types';

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
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={5} />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Delivery Status</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sent ✓', count: sent, bg: '#064e3b', color: '#34d399' },
            { label: 'Failed ✗', count: failed, bg: '#450a0a', color: '#f87171' },
            { label: 'Pending', count: pending, bg: '#0f172a', color: '#94a3b8' },
          ].map(({ label, count, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color, fontSize: 28, fontWeight: 700 }}>{count}</div>
              <div style={{ color, fontSize: 13, opacity: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>
        {failed > 0 && (
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>FAILED — click to retry</div>
            {participants.filter(p => p.email_status === 'failed').map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                <div>
                  <span style={{ color: '#e2e8f0' }}>{p.full_name}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>— {p.email_error}</span>
                </div>
                <button
                  onClick={() => { void retry(p.id); }}
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Name', 'Email', 'Company', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.full_name}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.email ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.company}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      background: p.email_status === 'sent' ? '#064e3b' : p.email_status === 'failed' ? '#450a0a' : '#1e293b',
                      color: p.email_status === 'sent' ? '#34d399' : p.email_status === 'failed' ? '#f87171' : '#94a3b8',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11,
                    }}>
                      {p.email_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
