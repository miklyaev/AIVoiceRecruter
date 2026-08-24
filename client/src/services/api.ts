import type { SettingsStatus, CreateInterviewResponse, AnswerResponse, Interview, Role, AdminReportItem } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getSettingsStatus(): Promise<SettingsStatus> {
  return request('/settings/status');
}

export async function saveSettings(apiKey: string, baseUrl: string): Promise<{ configured: boolean; maskedKey: string }> {
  return request('/settings/routerai', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, baseUrl }),
  });
}

export async function deleteSettings(): Promise<void> {
  await request('/settings/routerai', { method: 'DELETE' });
}

export async function testSettings(): Promise<{ connected: boolean; message: string }> {
  return request('/settings/test', { method: 'POST' });
}

export async function getRoles(): Promise<Role[]> {
  return request('/roles');
}

export async function createInterview(role: string): Promise<CreateInterviewResponse> {
  return request('/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

export async function getInterview(id: string): Promise<Interview> {
  return request(`/interviews/${id}`);
}

export async function sendAnswer(interviewId: string, audioBlob: Blob): Promise<AnswerResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const res = await fetch(`${API_BASE}/interviews/${interviewId}/answers`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка отправки ответа' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function finishInterview(interviewId: string): Promise<{ report: any; recruiterMessage: string }> {
  return request(`/interviews/${interviewId}/finish`, { method: 'POST' });
}

export async function generateSpeech(interviewId: string, messageId: string): Promise<{ audioUrl: string }> {
  return request(`/interviews/${interviewId}/messages/${messageId}/speech`, { method: 'POST' });
}

export async function getAdminReports(login: string, password: string): Promise<{ reports: AdminReportItem[] }> {
  const authHeader = 'Basic ' + btoa(`${login}:${password}`);
  const res = await fetch(`${API_BASE}/admin/reports`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}