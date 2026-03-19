import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import type { Workshop } from '../types';

export default function Schedule() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!workshopId) return;
    try {
      const w = await api.getWorkshop(workshopId);
      setWorkshop(w);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load workshop');
    }
  }, [workshopId]);

  useEffect(() => { void load(); }, [load]);

  async function handleSchedule() {
    if (!workshopId || !date) return;
    setSaving(true);
    setError(null);
    try {
      // Combine date + time, treat as UTC-6 (El Salvador) → convert to UTC
      const localIso = `${date}T${time}:00`;
      const utcDate = new Date(new Date(localIso).getTime() + 6 * 60 * 60 * 1000).toISOString();
      await api.scheduleEmails(workshopId, utcDate);
      navigate(`/status/${workshopId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to schedule');
      setSaving(false);
    }
  }

  async function handleSendNow() {
    if (!workshopId) return;
    setError(null);
    try {
      await api.sendNow(workshopId);
      navigate(`/status/${workshopId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={4} />
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px' }}>
        {error && (
          <div style={{ marginBottom: 16, color: '#f87171', background: '#450a0a', padding: '12px 16px', borderRadius: 8 }}>{error}</div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <h1 style={{ fontSize: 22, color: '#34d399', marginTop: 8 }}>Certificates Ready</h1>
          <p style={{ color: '#64748b' }}>
            {workshop ? workshop.name : 'Schedule or send emails now'}
          </p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>SCHEDULE EMAIL DELIVERY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>DATE</div>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>TIME (UTC-6)</div>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </div>
          </div>
          <button
            onClick={() => { void handleSchedule(); }}
            disabled={!date || saving}
            style={{ width: '100%', padding: '12px 0', background: date ? '#1d4ed8' : '#1e293b', color: date ? '#fff' : '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: date ? 'pointer' : 'not-allowed', marginBottom: 10 }}
          >
            {saving ? 'Scheduling...' : 'Schedule Send →'}
          </button>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            or{' '}
            <button
              onClick={() => { void handleSendNow(); }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
            >
              Send Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
