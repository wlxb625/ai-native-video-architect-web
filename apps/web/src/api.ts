import type {
  AgentSkillRunInput,
  CanvasSnapshot,
  MediaGenerationRunInput,
} from '@cineweave/contracts';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8780/v1';

let accessToken: string | null = null;

interface AuthResponse {
  accessToken: string;
  user: unknown;
}

interface RunResponse {
  run: { id: string; status: string; created_at?: string };
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function setAccessToken(value: string | null): void {
  accessToken = value;
}

function createHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  return headers;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: createHeaders(init.headers),
  });

  if (response.status === 401 && retry) {
    const refreshed = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
    });
    if (refreshed.ok) {
      const body = (await refreshed.json()) as AuthResponse;
      setAccessToken(body.accessToken);
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw Object.assign(
      new Error(body.message ?? `Request failed: ${response.status}`),
      { status: response.status, body },
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }, false),

  login: (email: string, password: string) =>
    request<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    ),

  register: (email: string, password: string, displayName: string) =>
    request<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      },
      false,
    ),

  projects: () => request<{ projects: unknown[] }>('/projects'),

  createProject: (title: string) =>
    request<{ project: unknown }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, description: '' }),
    }),

  canvas: (projectId: string) =>
    request<CanvasSnapshot>(`/projects/${projectId}/canvas`),

  saveCanvas: (projectId: string, snapshot: CanvasSnapshot) =>
    request<{ version: number }>(`/projects/${projectId}/canvas`, {
      method: 'PUT',
      body: JSON.stringify(snapshot),
    }),

  nextStep: (projectId: string, sourceNodeId: string, instruction: string) =>
    request<RunResponse>(`/projects/${projectId}/runs/next-step`, {
      method: 'POST',
      body: JSON.stringify({ sourceNodeId, instruction }),
    }),

  runSkill: (projectId: string, input: AgentSkillRunInput) =>
    request<RunResponse>(`/projects/${projectId}/agent/skills/run`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  generateMedia: (projectId: string, input: MediaGenerationRunInput) =>
    request<RunResponse>(`/projects/${projectId}/generations`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  async streamRunEvents(
    runId: string,
    onEvent: (event: { event: string; data: unknown }) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const headers = new Headers();
    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${baseUrl}/runs/${runId}/events`, {
      credentials: 'include',
      headers,
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Event stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = 'message';
        let data = '{}';
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) {
            event = line.slice(6).trim();
          }
          if (line.startsWith('data:')) {
            data = line.slice(5).trim();
          }
        }
        onEvent({ event, data: JSON.parse(data) as unknown });
        boundary = buffer.indexOf('\n\n');
      }
    }
  },
};
