import { normalizeApiBase } from './config.js';

export class MoltaskApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MoltaskApiError';
    this.details = details;
  }
}

export async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    const cause = error?.cause?.code || error?.cause?.message || error?.message || String(error);
    throw new MoltaskApiError(`Network request failed for ${url}: ${cause}`, {
      cause
    });
  }
  const text = await response.text();
  let body = null;
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    throw new MoltaskApiError(`HTTP ${response.status} from ${url}`, {
      status: response.status,
      body
    });
  }
  return body;
}

export async function fetchTasks({ apiBase, status } = {}) {
  const base = normalizeApiBase(apiBase);
  const url = new URL(`${base}/tasks`);
  if (status) {
    url.searchParams.set('status', status);
  }
  const body = await fetchJson(url.toString());
  return normalizeTasksResponse(body);
}

export async function submitTask({ apiBase, taskId, payload }) {
  const base = normalizeApiBase(apiBase);
  const url = `${base}/tasks/${encodeURIComponent(taskId)}/submit`;
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function normalizeTasksResponse(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const candidates = [
    body.tasks,
    body.asks,
    body.bounties,
    body.items,
    body.results,
    body.data,
    body.open
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (candidate && typeof candidate === 'object') {
      const nested = normalizeTasksResponse(candidate);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}
