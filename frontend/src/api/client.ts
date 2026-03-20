import type { Participant, LayoutJson, Workshop } from '../types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  uploadExcel: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ workshop_id: string; participant_count: number; warning_count: number }>(
      '/upload', { method: 'POST', body: fd }
    );
  },
  getWorkshop: (id: string) => req<Workshop>(`/workshops/${id}`),
  getParticipants: (workshopId: string) =>
    req<Participant[]>(`/workshops/${workshopId}/participants`),
  updateParticipant: (id: string, data: Partial<Participant>) =>
    req<Participant>(`/participants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteParticipant: (id: string) =>
    req<{ ok: boolean }>(`/participants/${id}`, { method: 'DELETE' }),
  getProgress: (workshopId: string) =>
    req<{ total: number; done: number }>(`/workshops/${workshopId}/progress`),
  generatePdfs: (workshopId: string) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/generate`, { method: 'POST' }),
  saveLayout: (workshopId: string, layout: LayoutJson) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/layout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_json: layout }),
    }),
  sendNow: (workshopId: string) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/send`, { method: 'POST' }),
  retryEmail: (participantId: string) =>
    req<{ ok: boolean }>(`/participants/${participantId}/retry`, { method: 'POST' }),
};
