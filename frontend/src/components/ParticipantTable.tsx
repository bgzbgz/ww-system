import { useState } from 'react';
import { api } from '../api/client';
import type { Participant } from '../types';

const F = { plaak: "'Plaak', Impact, sans-serif", riforma: "'Riforma', Arial, sans-serif" };

const WARNING_LABELS: Record<string, string> = {
  missing_email: 'No email',
  invalid_email: 'Invalid email',
  duplicate_name: 'Duplicate',
};

export default function ParticipantTable({ participants, onUpdate }: {
  participants: Participant[];
  onUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Participant>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  async function saveEdit(id: string) {
    try {
      await api.updateParticipant(id, editData);
      setEditingId(null); setEditData({}); onUpdate();
    } catch (e: unknown) { setActionError(e instanceof Error ? e.message : 'Save failed'); }
  }

  async function deleteRow(id: string) {
    try { await api.deleteParticipant(id); onUpdate(); }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  const inputStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', borderBottom: '1px solid #555',
    color: '#fff', fontFamily: F.riforma, fontSize: 14, padding: '2px 0',
    width: '100%', outline: 'none',
  };

  return (
    <div>
      {actionError && (
        <div style={{ fontFamily: F.riforma, fontSize: 13, color: '#f87171', borderLeft: '2px solid #f87171', paddingLeft: 16, marginBottom: 20 }}>
          {actionError}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            {['#', 'Full Name', 'Email', 'Company', 'Status', ''].map((h, i) => (
              <th key={i} style={{
                fontFamily: F.riforma, fontSize: 10, fontWeight: 400, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#fff', textAlign: i === 5 ? 'right' : 'left',
                padding: '0 20px 14px 0', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => {
            const isEditing = editingId === p.id;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #111' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 20px 14px 0', fontFamily: F.riforma, fontSize: 12, color: '#fff', width: 32, verticalAlign: 'middle' }}>{idx + 1}</td>
                <td style={{ padding: '14px 20px 14px 0', verticalAlign: 'middle', minWidth: 180 }}>
                  {isEditing
                    ? <input value={editData.full_name ?? p.full_name} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))} style={inputStyle} />
                    : <span style={{ fontFamily: F.riforma, fontSize: 14, color: '#fff' }}>{p.full_name}</span>}
                </td>
                <td style={{ padding: '14px 20px 14px 0', verticalAlign: 'middle', minWidth: 200 }}>
                  {isEditing
                    ? <input value={editData.email ?? p.email ?? ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} style={inputStyle} />
                    : <span style={{ fontFamily: F.riforma, fontSize: 13, color: p.email ? '#aaa' : '#666' }}>{p.email || '—'}</span>}
                </td>
                <td style={{ padding: '14px 20px 14px 0', verticalAlign: 'middle', minWidth: 160 }}>
                  {isEditing
                    ? <input value={editData.company ?? p.company} onChange={e => setEditData(d => ({ ...d, company: e.target.value }))} style={inputStyle} />
                    : <span style={{ fontFamily: F.riforma, fontSize: 13, color: '#fff' }}>{p.company}</span>}
                </td>
                <td style={{ padding: '14px 20px 14px 0', verticalAlign: 'middle', width: 130 }}>
                  {p.warning ? (
                    <span style={{ fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', background: '#fbbf24', padding: '4px 10px', display: 'inline-block' }}>
                      {WARNING_LABELS[p.warning] ?? p.warning}
                    </span>
                  ) : (
                    <span style={{ fontFamily: F.riforma, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', background: '#4ade80', padding: '4px 10px', display: 'inline-block' }}>
                      Ready
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 0', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end' }}>
                      <button onClick={() => void saveEdit(p.id)} style={{ fontFamily: F.riforma, fontSize: 12, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>Save</button>
                      <button onClick={() => { setEditingId(null); setEditData({}); }} style={{ fontFamily: F.riforma, fontSize: 12, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditingId(p.id); setEditData({}); }} style={{ fontFamily: F.riforma, fontSize: 12, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>Edit</button>
                      <button onClick={() => void deleteRow(p.id)} style={{ fontFamily: F.riforma, fontSize: 12, background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>Remove</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
