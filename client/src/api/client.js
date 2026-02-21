const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('betterhire_token');
}

function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function api(path, options = {}) {
  const { method = 'GET', body, auth = true } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(auth),
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function setToken(token) {
  if (token) localStorage.setItem('betterhire_token', token);
  else localStorage.removeItem('betterhire_token');
}

export function getStoredToken() {
  return getToken();
}
