import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadExcel(file);
      navigate(`/review/${result.workshop_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={0} />
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Upload Participant Excel</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Drop your .xlsx file to get started</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { void handleFile(f); } }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#3b82f6' : '#334155'}`,
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#1e3a5f' : '#1e293b',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 600 }}>{loading ? 'Processing...' : 'Drop Excel file here'}</div>
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>or click to browse — .xlsx and .xls</div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { void handleFile(f); } }}
          />
        </div>
        {error && (
          <div style={{ marginTop: 16, color: '#f87171', background: '#450a0a', padding: '12px 16px', borderRadius: 8 }}>{error}</div>
        )}
        <div style={{ marginTop: 24, background: '#1e293b', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EXPECTED COLUMNS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Full Name', 'Email', 'Company'].map(c => (
              <code key={c} style={{ background: '#0f172a', color: '#34d399', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>{c}</code>
            ))}
            <code style={{ background: '#0f172a', color: '#64748b', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>Position (optional)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
