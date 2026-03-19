import { useState, useRef, useCallback } from 'react';
import type { LayoutJson, LayoutBlock, Participant } from '../types';

const DEFAULT_LAYOUT: LayoutJson = {
  full_name: { x: '50%', y: '68mm', font: 'Playfair Display', size: 36, color: '#ffffff', bold: true, italic: false },
  company:   { x: '50%', y: '90mm', font: 'Montserrat', size: 14, color: '#c9a84c', bold: false, italic: false },
  date:      { x: '50%', y: '102mm', font: 'Montserrat', size: 11, color: '#666666', bold: false, italic: false },
};

const FONTS = ['Playfair Display', 'Montserrat', 'Georgia', 'Arial', 'Times New Roman'];

export default function CertEditor({
  layout: initialLayout,
  participants,
  onSave,
}: {
  layout?: LayoutJson | null;
  participants: Participant[];
  onSave: (layout: LayoutJson) => void;
}) {
  const [layout, setLayout] = useState<LayoutJson>(initialLayout || DEFAULT_LAYOUT);
  const [selected, setSelected] = useState<keyof LayoutJson | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const preview = participants[previewIdx];

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
        <div
          ref={containerRef}
          style={{ position: 'relative', background: '#0a0a0a', border: '2px solid #c9a84c', aspectRatio: '297/210', userSelect: 'none' }}
        >
          {(Object.keys(layout) as (keyof LayoutJson)[]).map(field => {
            const b = layout[field];
            const value = field === 'full_name' ? (preview?.full_name || 'Full Name') :
                          field === 'company'   ? (preview?.company || 'Company') : 'March 2026';
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
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </span>
            );
          })}
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
