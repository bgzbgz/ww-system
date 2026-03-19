import { useState } from 'react';
import type { Participant } from '../types';
import { api } from '../api/client';

const WARNING_LABELS: Record<string, string> = {
  missing_email: '⚠ missing email',
  invalid_email: '⚠ invalid email',
  duplicate_name: '⚠ duplicate name',
};

export default function ParticipantTable({
  participants,
  onUpdate,
}: {
  participants: Participant[];
  onUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Participant>>({});

  async function save(id: string) {
    await api.updateParticipant(id, editData);
    setEditingId(null);
    onUpdate();
  }

  async function remove(id: string) {
    await api.deleteParticipant(id);
    onUpdate();
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#0f172a' }}>
          {['#', 'Full Name', 'Email', 'Company', 'Status', ''].map((h) => (
            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {participants.map((p, i) => (
          <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
            <td style={{ padding: '8px 12px', color: '#64748b' }}>{i + 1}</td>
            {editingId === p.id ? (
              <>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td />
                <td style={{ padding: '4px 8px', display: 'flex', gap: 4 }}>
                  <button onClick={() => { void save(p.id); }} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                </td>
              </>
            ) : (
              <>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.full_name}</td>
                <td style={{ padding: '8px 12px', color: p.warning?.includes('email') ? '#fbbf24' : '#94a3b8' }}>
                  {p.warning?.includes('email') ? WARNING_LABELS[p.warning!] : p.email || '—'}
                </td>
                <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.company}</td>
                <td style={{ padding: '8px 12px' }}>
                  {p.warning ? (
                    <span style={{ background: '#451a03', color: '#fbbf24', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{WARNING_LABELS[p.warning]}</span>
                  ) : (
                    <span style={{ background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Ready</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditingId(p.id); setEditData({}); }} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => { void remove(p.id); }} style={{ background: '#450a0a', color: '#f87171', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
