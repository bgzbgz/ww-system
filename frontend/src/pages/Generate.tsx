import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ProgressBar from '../components/ProgressBar';
import { api } from '../api/client';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

export default function Generate() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function start() {
    if (!workshopId) return;
    try {
      await api.generatePdfs(workshopId);
      setStarted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start generation');
    }
  }

  const handleComplete = useCallback(() => setDone(true), []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: 48 }}>
      <StepNav current={2} />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 40px 60px' }}>

        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Step 03
          </p>
          <h1 style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
            Generate
          </h1>
          <p style={{ fontFamily: F.riforma, fontSize: 15, color: '#fff', marginTop: 16, lineHeight: 1.6 }}>
            Render a personalized PDF certificate for each participant.
          </p>
        </div>

        {error && (
          <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#f87171', borderLeft: '2px solid #f87171', paddingLeft: 16, marginBottom: 32 }}>
            {error}
          </div>
        )}

        {!started ? (
          <button
            onClick={() => { void start(); }}
            style={{
              fontFamily: F.riforma, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: '#fff', color: '#000', border: 'none',
              padding: '14px 36px', cursor: 'pointer',
            }}
          >
            Generate All Certificates
          </button>
        ) : done ? (
          <div>
            <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
              All certificates generated
            </div>
            <button
              onClick={() => navigate(`/preview/${workshopId}`)}
              style={{
                fontFamily: F.riforma, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#fff', color: '#000', border: 'none',
                padding: '14px 36px', cursor: 'pointer',
              }}
            >
              Preview Certificates →
            </button>
          </div>
        ) : (
          <div style={{ paddingTop: 8 }}>
            <ProgressBar workshopId={workshopId!} onComplete={handleComplete} />
          </div>
        )}
      </div>
    </div>
  );
}
