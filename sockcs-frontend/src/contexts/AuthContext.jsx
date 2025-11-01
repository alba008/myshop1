// sockcs-frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "../lib/fetchWithAuth";

const AuthContext = createContext();
const TOKENS_KEY = "auth.tokens";

function normalizeUser(u) {
  if (!u) return null;
  const is_super = !!(u.is_superuser === true);
  const is_staff = !!(is_super || u.is_staff === true);
  return { ...u, is_superuser: is_super, is_staff };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKENS_KEY);
  }, [tokens]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!tokens?.access) { if (!cancelled) { setUser(null); setLoading(false); } return; }
        const res = await fetchWithAuth("/api/accounts/me/");
        if (res.ok) {
          const raw = await res.json();
          if (!cancelled) setUser(normalizeUser(raw));
        } else {
          if (!cancelled) setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tokens?.access]);

  const login = async ({ username, email, password }) => {
    const body = username ? { username, password } : { email, password };
    const r = await fetch("/api/accounts/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",            // ← no cookies
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.detail || "Login failed");

    // store tokens
    if (data?.access || data?.refresh) {
      setTokens({ access: data.access, refresh: data.refresh });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
    }

    // load user via /me using Bearer
    const meRes = await fetchWithAuth("/api/accounts/me/");
    if (!meRes.ok) throw new Error("Could not load profile");
    const me = await meRes.json();
    setUser(normalizeUser(me));
    return me;
  };

  const register = async (form) => {
    const r = await fetch("/api/accounts/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (!r.ok) {
      throw new Error(
        data?.email?.[0] || data?.username?.[0] || data?.password?.[0] || data?.detail || "Registration failed"
      );
    }
    if (data?.access || data?.refresh) {
      setTokens({ access: data.access, refresh: data.refresh });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
    }
    const meRes = await fetchWithAuth("/api/accounts/me/");
    if (!meRes.ok) throw new Error("Could not load profile");
    const me = await meRes.json();
    setUser(normalizeUser(me));
    return me;
  };

  const logout = async () => {
    try { await fetch("/api/accounts/logout/", { method: "POST", credentials: "omit" }); } catch {}
    setUser(null);
    setTokens(null);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  };

  const value = useMemo(() => ({ user, tokens, loading, login, register, logout, setTokens, setUser }), [user, tokens, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
