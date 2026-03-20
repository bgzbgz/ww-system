import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import type { Workshop } from '../types';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

export default function Send() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [sending, setSending] = useState(false);
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

  async function handleSend() {
    if (!workshopId) return;
    setSending(true);
    setError(null);
    try {
      await api.sendNow(workshopId);
      navigate(`/status/${workshopId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send');
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: 48 }}>
      <StepNav current={4} />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 40px 60px' }}>

        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Step 05
          </p>
          <h1 style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
            Send
          </h1>
          {workshop && (
            <p style={{ fontFamily: F.riforma, fontSize: 15, color: '#fff', marginTop: 16, lineHeight: 1.6 }}>
              {workshop.name}
            </p>
          )}
        </div>

        {error && (
          <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#f87171', borderLeft: '2px solid #f87171', paddingLeft: 16, marginBottom: 32 }}>
            {error}
          </div>
        )}

        <p style={{ fontFamily: F.riforma, fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 48 }}>
          This will trigger the n8n workflow and send each participant their certificate via Outlook.
        </p>

        <button
          onClick={() => { void handleSend(); }}
          disabled={sending}
          style={{
            fontFamily: F.riforma, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            width: '100%', padding: '14px 0',
            background: sending ? 'transparent' : '#fff469',
            color: sending ? '#444' : '#000',
            border: sending ? '1px solid #333' : 'none',
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending…' : 'Send Certificates →'}
        </button>
      </div>
    </div>
  );
}
