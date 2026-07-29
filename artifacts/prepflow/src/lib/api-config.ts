/**
 * Configures API Base URL for local development and Vercel production deployments.
 * 
 * If VITE_API_BASE_URL is defined (e.g. "https://api-server.vercel.app"), endpoints resolve to the backend service.
 * If VITE_API_BASE_URL is not set, endpoints default to relative "/api/*" paths.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}
