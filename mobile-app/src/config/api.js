export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    
    if (!res.ok) {
      // Handle known JSON formatted errors
      if (contentType && contentType.includes('application/json')) {
        const errData = await res.json();
        throw new Error(errData.message || 'API request failed');
      }
      throw new Error(`HTTP Status Code: ${res.status}`);
    }
    
    // Parse valid JSON
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    
    return res;
  } catch (error) {
    throw error;
  }
};
