import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import type { Participant } from '../types';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

export default function PreviewCerts() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workshopId) return;
    api.getParticipants(workshopId).then((data) => {
      const withCert = data.filter((p) => p.certificate_url);
      setParticipants(withCert);
      if (withCert.length > 0) setSelected(withCert[0]);
      setLoading(false);
    });
  }, [workshopId]);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <StepNav current={3} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 48px)', marginTop: 48 }}>

        {/* Left sidebar */}
        <div style={{
          width: 280,
          flexShrink: 0,
          background: '#000',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #1a1a1a' }}>
            <p style={{ fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
              Step 04
            </p>
            <div style={{ fontFamily: F.plaak, fontWeight: 700, fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
              Preview
            </div>
            <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#fff', marginTop: 8 }}>
              {loading ? '—' : `${participants.length} certificate${participants.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Participant list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px 24px', fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>Loading…</div>
            ) : participants.length === 0 ? (
              <div style={{ padding: '20px 24px', fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>No certificates found.</div>
            ) : (
              participants.map((p) => {
                const isActive = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '14px 24px',
                      background: isActive ? '#0d0d0d' : 'transparent',
                      border: 'none',
                      borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: isActive ? '#fff469' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid #0d0d0d',
                    }}
                  >
                    <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#fff', marginBottom: 2 }}>{p.full_name}</div>
                    <div style={{ fontFamily: F.riforma, fontSize: 11, color: '#fff', letterSpacing: '0.03em' }}>{p.company}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom CTA */}
          <div style={{ padding: '20px 24px', borderTop: '1px solid #1a1a1a' }}>
            <button
              onClick={() => navigate(`/send/${workshopId}`)}
              style={{
                fontFamily: F.riforma, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                width: '100%', padding: '12px 0',
                background: '#fff', color: '#000', border: 'none',
                cursor: 'pointer',
              }}
            >
              Send Emails →
            </button>
          </div>
        </div>

        {/* Right: PDF embed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
          {selected ? (
            <>
              {/* Preview header bar */}
              <div style={{
                padding: '14px 24px',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: F.riforma, fontSize: 14, color: '#fff' }}>{selected.full_name}</span>
                  <span style={{ fontFamily: F.riforma, fontSize: 12, color: '#fff' }}>{selected.company}</span>
                </div>
                <a
                  href={selected.certificate_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: F.riforma, fontSize: 11, color: '#fff', textDecoration: 'none', letterSpacing: '0.05em', borderBottom: '1px solid #333', paddingBottom: 1 }}
                >
                  Open PDF ↗
                </a>
              </div>
              <iframe
                key={selected.id}
                src={`${selected.certificate_url}#toolbar=0&navpanes=0&scrollbar=0`}
                style={{ flex: 1, border: 'none', width: '100%' }}
                title={`Certificate — ${selected.full_name}`}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>
              {loading ? 'Loading certificates…' : 'Select a participant'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
