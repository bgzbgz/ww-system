import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';

const F = {
  plaak: "'Plaak', Impact, sans-serif",
  riforma: "'Riforma', Arial, sans-serif",
};

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
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: 48 }}>
      <StepNav current={0} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 40px 60px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Step 01
          </p>
          <h1 style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
            Upload
          </h1>
          <p style={{ fontFamily: F.riforma, fontSize: 15, color: '#fff', marginTop: 16, lineHeight: 1.6 }}>
            Add the participant Excel file to generate certificates.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void handleFile(f); }}
          onClick={() => !loading && inputRef.current?.click()}
          style={{
            border: `1px solid ${dragging ? '#fff469' : '#222'}`,
            background: dragging ? '#0d0d0d' : 'transparent',
            padding: '64px 40px',
            textAlign: 'center',
            cursor: loading ? 'default' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />

          {loading ? (
            <>
              <div style={{ fontFamily: F.plaak, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>
                Processing
              </div>
              <div style={{ width: 40, height: 1, background: '#222', margin: '16px auto 0', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                  background: '#fff', animation: 'slide 1s infinite linear',
                }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color: dragging ? '#fff469' : '#fff', marginBottom: 10 }}>
                {dragging ? 'Release to upload' : 'Drop file here'}
              </div>
              <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>
                or click to browse — .xlsx and .xls
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, fontFamily: F.riforma, fontSize: 13, color: '#f87171', borderLeft: '2px solid #f87171', paddingLeft: 16 }}>
            {error}
          </div>
        )}

        {/* Template download */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <a
            href="https://vymbdorbcbawagtpjkgu.supabase.co/storage/v1/object/public/templates/participant_template.xlsx"
            download="participant_template.xlsx"
            style={{ fontFamily: F.riforma, fontSize: 12, color: '#000', background: '#fff', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 20px', display: 'inline-block', whiteSpace: 'nowrap' }}
            onClick={e => e.stopPropagation()}
          >
            Download template
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slide { from { left: -100%; } to { left: 100%; } }
      `}</style>
    </div>
  );
}
