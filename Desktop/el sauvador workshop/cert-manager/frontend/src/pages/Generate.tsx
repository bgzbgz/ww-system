import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ProgressBar from '../components/ProgressBar';
import { api } from '../api/client';

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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={3} />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        {error && (
          <div style={{ marginBottom: 24, color: '#f87171', background: '#450a0a', padding: '12px 16px', borderRadius: 8 }}>{error}</div>
        )}
        {!started ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Ready to Generate</h1>
            <p style={{ color: '#64748b', marginBottom: 32 }}>Puppeteer will render a personalized PDF for each participant.</p>
            <button onClick={() => { void start(); }} style={{ padding: '12px 32px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Generate All Certificates
            </button>
          </>
        ) : done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 22, marginBottom: 8, color: '#34d399' }}>All certificates generated!</h1>
            <button onClick={() => navigate(`/schedule/${workshopId}`)} style={{ padding: '12px 32px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 24 }}>
              Schedule Emails →
            </button>
          </>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32 }}>
            <ProgressBar workshopId={workshopId!} onComplete={() => setDone(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
