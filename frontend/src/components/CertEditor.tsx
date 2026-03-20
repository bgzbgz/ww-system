import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayoutJson, LayoutBlock, Participant } from '../types';

const DEFAULT_LAYOUT: LayoutJson = {
  full_name: { x: '50%', y: '57.3%', font: 'Playfair Display', size: 36, color: '#fff469', bold: false, italic: false },
  company:   { x: '50%', y: '70%',   font: 'Montserrat', size: 14, color: '#ffffff', bold: false, italic: false },
  date:      { x: '6%',  y: '90%',   font: 'Montserrat', size: 11, color: '#ffffff', bold: false, italic: false },
};

// A4 landscape at 96dpi: 297mm × 210mm = 1122.5 × 793.7px
const CERT_W_MM = 297;
const CERT_H_MM = 210;
const MM_TO_PX = 96 / 25.4;
const CERT_W_PX = CERT_W_MM * MM_TO_PX;
const CERT_H_PX = CERT_H_MM * MM_TO_PX;

const FONTS = ['Playfair Display', 'Montserrat', 'Georgia', 'Arial', 'Times New Roman'];

export default function CertEditor({
  layout: initialLayout,
  participants,
  workshopId,
  onSave,
}: {
  layout?: LayoutJson | null;
  participants: Participant[];
  workshopId: string;
  onSave: (layout: LayoutJson) => void;
}) {
  const [layout, setLayout] = useState<LayoutJson>(initialLayout || DEFAULT_LAYOUT);
  const [selected, setSelected] = useState<keyof LayoutJson | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [previewHtml, setPreviewHtml] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const preview = participants[previewIdx];

  // Fetch certificate HTML and set as srcdoc (avoids SPA catch-all routing)
  useEffect(() => {
    const name = preview?.full_name || 'Sample Name';
    fetch(`/api/workshops/${workshopId}/cert-preview?full_name=${encodeURIComponent(name)}`)
      .then(r => r.text())
      .then(html => setPreviewHtml(html))
      .catch(() => {});
  }, [workshopId, preview?.full_name]);

  // Scale iframe to fit container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CERT_W_PX);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateBlock = useCallback((field: keyof LayoutJson, updates: Partial<LayoutBlock>) => {
    setLayout(l => ({ ...l, [field]: { ...l[field], ...updates } }));
  }, []);

  const startDrag = useCallback((field: keyof LayoutJson, e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    function onMove(ev: MouseEvent) {
      const x = ((ev.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
      const y = ((ev.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
      updateBlock(field, { x, y });
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [updateBlock]);

  const sel = selected ? layout[selected] : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
      {/* Certificate preview */}
      <div>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Preview as:</span>
          <select
            value={previewIdx}
            onChange={e => setPreviewIdx(Number(e.target.value))}
            style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}
          >
            {participants.map((p, i) => (
              <option key={p.id} value={i}>{p.full_name}</option>
            ))}
          </select>
        </div>

        {/* Outer wrapper: sets the visible dimensions = cert scaled to container width */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: `${CERT_H_PX * scale}px`,
          border: '2px solid #334155',
          overflow: 'hidden',
          userSelect: 'none',
        }}>
          {/* Inner ref div — full unscaled cert dimensions, used for drag coords */}
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: `${CERT_W_PX}px`,
              height: `${CERT_H_PX}px`,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
          >
            {/* Real certificate HTML via srcdoc — avoids SPA catch-all */}
            <iframe
              srcDoc={previewHtml || '<body style="background:#000"></body>'}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: `${CERT_W_PX}px`,
                height: `${CERT_H_PX}px`,
                border: 'none',
                pointerEvents: 'none',
              }}
              title="certificate preview"
            />
            {/* Draggable text overlays */}
            {(Object.keys(layout) as (keyof LayoutJson)[]).map(field => {
              const b = layout[field];
              const value = field === 'full_name' ? (preview?.full_name || 'Full Name') :
                            field === 'company'   ? (preview?.company   || 'Company')   : 'March 2026';
              return (
                <span
                  key={field}
                  onMouseDown={e => { setSelected(field); startDrag(field, e); }}
                  style={{
                    position: 'absolute',
                    left: b.x, top: b.y,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: b.font,
                    fontSize: b.size,
                    color: b.color,
                    fontWeight: b.bold ? 'bold' : 'normal',
                    fontStyle: b.italic ? 'italic' : 'normal',
                    cursor: 'move',
                    outline: selected === field ? '2px dashed #3b82f6' : 'none',
                    outlineOffset: 4,
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}
                >
                  {value}
                </span>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 11 }}>Click and drag text blocks to reposition</div>
      </div>

      {/* Controls sidebar */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 16 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          {selected ? `Editing: ${selected.replace('_', ' ')}` : 'Select a text block to edit'}
        </div>
        {sel && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Font Family
              <select value={sel.font} onChange={e => updateBlock(selected, { font: e.target.value })}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px' }}>
                {FONTS.map(f => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>Font Size (px)
              <input type="number" value={sel.size} onChange={e => updateBlock(selected, { size: Number(e.target.value) })}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px' }} />
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>Color
              <input type="color" value={sel.color} onChange={e => updateBlock(selected, { color: e.target.value })}
                style={{ display: 'block', width: '100%', marginTop: 4, height: 36, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }} />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => updateBlock(selected, { bold: !sel.bold })}
                style={{ flex: 1, padding: '6px 0', background: sel.bold ? '#1d4ed8' : '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>B</button>
              <button onClick={() => updateBlock(selected, { italic: !sel.italic })}
                style={{ flex: 1, padding: '6px 0', background: sel.italic ? '#1d4ed8' : '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 4, fontStyle: 'italic', cursor: 'pointer' }}>I</button>
            </div>
          </div>
        )}
        <button onClick={() => onSave(layout)}
          style={{ width: '100%', marginTop: 20, padding: '10px 0', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Apply to All →
        </button>
      </div>
    </div>
  );
}
