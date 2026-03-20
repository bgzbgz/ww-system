import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ParticipantTable from '../components/ParticipantTable';
import { api } from '../api/client';
import type { Participant } from '../types';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

export default function Review() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!workshopId) return;
    try {
      const data = await api.getParticipants(workshopId);
      setParticipants(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load participants');
    }
  }, [workshopId]);

  useEffect(() => { void load(); }, [load]);

  const warningCount = participants.filter((p) => p.warning).length;
  const canProceed = warningCount === 0 && participants.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: 48 }}>
      <StepNav current={1} />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 40px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
              Step 02
            </p>
            <h1 style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
              Review
            </h1>
            <p style={{ fontFamily: F.riforma, fontSize: 15, color: '#fff', marginTop: 16, lineHeight: 1.6 }}>
              {participants.length} participant{participants.length !== 1 ? 's' : ''} found
              {warningCount > 0 && (
                <span style={{ color: '#fbbf24', marginLeft: 12 }}>
                  — {warningCount} issue{warningCount > 1 ? 's' : ''} to resolve
                </span>
              )}
            </p>
          </div>

          <button
            disabled={!canProceed}
            onClick={() => navigate(`/generate/${workshopId}`)}
            style={{
              fontFamily: F.riforma, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: canProceed ? '#fff' : 'transparent',
              color: canProceed ? '#000' : '#444',
              border: canProceed ? 'none' : '1px solid #333',
              padding: '12px 28px',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {warningCount > 0 ? `Fix ${warningCount} issue${warningCount > 1 ? 's' : ''} first` : 'Generate Certificates →'}
          </button>
        </div>

        {error && (
          <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#f87171', borderLeft: '2px solid #f87171', paddingLeft: 16, marginBottom: 24 }}>
            {error}
          </div>
        )}

        <ParticipantTable participants={participants} onUpdate={load} />
      </div>
    </div>
  );
}
