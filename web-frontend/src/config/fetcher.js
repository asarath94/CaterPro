import API_BASE from './api';

/**
 * SWR fetcher — uses [url, token] tuple as the cache key.
 * This lets SWR cache responses per-user and per-endpoint automatically.
 */
export const fetcherWithToken = ([url, token]) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });

/**
 * Build a full API URL from a relative path.
 * e.g. apiUrl('/api/customers') → 'https://caterpro.onrender.com/api/customers'
 */
export const apiUrl = (path) => `${API_BASE}${path}`;
