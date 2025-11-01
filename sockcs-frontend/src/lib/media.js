const ORIGIN = (import.meta.env.VITE_MEDIA_ORIGIN || "").replace(/\/+$/, "");

export function media(u) {
  if (!u) return "/media/placeholder.png";
  const s = String(u).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  const path = s.startsWith("/media/") ? s : `/media/${s.replace(/^\/+/, "")}`;
  return ORIGIN ? `${ORIGIN}${path}` : path;
}
