import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const F = { riforma: "'Riforma', Arial, sans-serif" };

export default function ProgressBar({ workshopId, onComplete }: {
  workshopId: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const checkProgress = useCallback(async () => {
    try {
      const p = await api.getProgress(workshopId);
      setProgress(p);
      if (p.total > 0 && p.done >= p.total) {
        onComplete();
      }
    } catch {
      // silently ignore polling errors
    }
  }, [workshopId, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => { void checkProgress(); }, 2000);
    return () => clearInterval(interval);
  }, [checkProgress]);

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.riforma, fontSize: 13, color: '#fff', marginBottom: 12 }}>
        <span>Generating certificates</span>
        <span style={{ color: '#fff' }}>{progress.done} / {progress.total}</span>
      </div>
      <div style={{ background: '#111', height: 1, width: '100%', position: 'relative' }}>
        <div style={{
          background: '#fff469',
          height: '100%',
          width: `${pct}%`,
          transition: 'width 0.5s ease',
          position: 'absolute', top: 0, left: 0,
        }} />
      </div>
      <div style={{ fontFamily: F.riforma, fontSize: 11, color: '#fff', marginTop: 8, letterSpacing: '0.05em' }}>
        {pct}% complete
      </div>
    </div>
  );
}
