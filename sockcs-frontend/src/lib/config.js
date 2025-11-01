const DEFAULT_HOST = import.meta.env.VITE_API_HOST || "10.0.0.47";
const host  = import.meta.env.VITE_API_HOST  || DEFAULT_HOST;
const port  = import.meta.env.VITE_API_PORT  || "8000";
const proto = import.meta.env.VITE_API_PROTO || "http";

export const API_BASE   = `${proto}://${host}:${port}`;
export const MEDIA_BASE = API_BASE;

export function sameOrigin(urlLike) {
  if (!urlLike) return "";
  try {
    const u = new URL(urlLike);
    const base = new URL(API_BASE);
    u.protocol = base.protocol;
    u.hostname = base.hostname;
    u.port     = base.port;
    return u.toString();
  } catch {
    return String(urlLike).startsWith("/media/") ? `${MEDIA_BASE}${urlLike}` : String(urlLike);
  }
}
console.info("[API_BASE]", API_BASE);
