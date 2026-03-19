import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

export default function ProgressBar({ workshopId, onComplete }: { workshopId: string; onComplete: () => void }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
        <span>Generating certificates...</span>
        <span>{progress.done} / {progress.total}</span>
      </div>
      <div style={{ background: '#1e293b', borderRadius: 4, height: 8 }}>
        <div style={{ background: '#1d4ed8', height: '100%', borderRadius: 4, width: `${pct}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
