const RAW_API_URL = String(import.meta.env.VITE_API_URL || 'https://api.movyo.delivery').replace(/\/$/, '');

export const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const MAPBOX_TOKEN = String(import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
