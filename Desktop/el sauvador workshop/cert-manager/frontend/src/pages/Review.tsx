import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ParticipantTable from '../components/ParticipantTable';
import { api } from '../api/client';
import type { Participant } from '../types';

export default function Review() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();

  async function load() {
    if (!workshopId) return;
    const data = await api.getParticipants(workshopId);
    setParticipants(data);
  }

  useEffect(() => { void load(); }, [workshopId]);

  const warningCount = participants.filter((p) => p.warning).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={1} />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>Review Participants</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>{participants.length} participants found</p>
          </div>
          <button
            disabled={warningCount > 0}
            onClick={() => navigate(`/editor/${workshopId}`)}
            style={{
              padding: '10px 24px',
              background: warningCount > 0 ? '#1e293b' : '#1d4ed8',
              color: warningCount > 0 ? '#475569' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: warningCount > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {warningCount > 0 ? `Fix ${warningCount} warning${warningCount > 1 ? 's' : ''} first` : 'Proceed to Editor →'}
          </button>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
          <ParticipantTable participants={participants} onUpdate={load} />
        </div>
      </div>
    </div>
  );
}
