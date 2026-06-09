/**
 * Base API client — wraps fetch with default options.
 * All service modules use this instead of calling fetch directly.
 */

const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',        // send httpOnly cookies
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',   body }),
  put:    (path, body)   => request(path, { method: 'PUT',    body }),
  delete: (path, body)   => request(path, { method: 'DELETE', body }),
};
