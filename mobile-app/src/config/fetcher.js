import { fetchApi } from './api';

/**
 * Mobile SWR fetcher — uses [url, token] as the cache key.
 */
export const swrFetcher = async ([endpoint, token]) => {
  return await fetchApi(endpoint, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
