import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import CertEditor from '../components/CertEditor';
import { api } from '../api/client';
import type { Workshop, Participant, LayoutJson } from '../types';

export default function Editor() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!workshopId) return;
    try {
      const [w, p] = await Promise.all([
        api.getWorkshop(workshopId),
        api.getParticipants(workshopId),
      ]);
      setWorkshop(w);
      setParticipants(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load workshop');
    }
  }, [workshopId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = useCallback(async (layout: LayoutJson) => {
    if (!workshopId) return;
    try {
      await api.saveLayout(workshopId, layout);
      navigate(`/generate/${workshopId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save layout');
    }
  }, [workshopId, navigate]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
        <StepNav current={2} />
        <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
          <div style={{ color: '#f87171', background: '#450a0a', padding: '12px 16px', borderRadius: 8 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return <div style={{ background: '#0f172a', minHeight: '100vh' }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={2} />
      <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Certificate Editor</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Drag text blocks to position. Click "Apply to All" when done.</p>
        <CertEditor layout={workshop.layout_json} participants={participants} onSave={handleSave} />
      </div>
    </div>
  );
}
