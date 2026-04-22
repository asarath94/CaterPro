// Central API base URL — blank in dev (uses Vite proxy), Render URL in production
const API_BASE = import.meta.env.VITE_API_URL || '';
export default API_BASE;
