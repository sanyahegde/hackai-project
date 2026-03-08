const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function createProfile(data) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = Array.isArray(err.detail) ? err.detail.map((d) => d.msg || d.loc?.join('.')).join(', ') : (err.detail || 'Failed to create profile');
    throw new Error(msg);
  }
  return res.json();
}

export async function getProfile(userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch profile');
  }
  return res.json();
}
