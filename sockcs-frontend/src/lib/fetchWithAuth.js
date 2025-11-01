// src/lib/fetchWithAuth.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://10.0.0.47:8000";

const TOKENS_KEY = "auth.tokens";
const getTokens = () => {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || "null"); } catch { return null; }
};
const setTokens = (t) => {
  if (t) localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
  else localStorage.removeItem(TOKENS_KEY);
};

const resolveUrl = (url) =>
  /^https?:\/\//i.test(url) ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;

async function refreshToken() {
  const refresh = getTokens()?.refresh;
  if (!refresh) return null;
  const r = await fetch(resolveUrl("/api/accounts/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (j?.access) {
    const pack = getTokens() || {};
    pack.access = j.access;
    setTokens(pack);
    return j.access;
  }
  return null;
}

export async function fetchWithAuth(url, { method = "GET", headers, body } = {}) {
  const tokens = getTokens();
  const doFetch = (access) =>
    fetch(resolveUrl(url), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...(headers || {}),
      },
      credentials: "omit",
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(tokens?.access);
  if (res.status === 401) {
    const newAccess = await refreshToken();
    if (!newAccess) return res;
    res = await doFetch(newAccess);
  }
  return res;
}

export { getTokens, setTokens, API_BASE };
