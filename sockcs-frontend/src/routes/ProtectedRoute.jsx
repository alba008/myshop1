// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function parseJwt(token) {
  try {
    const [, payload] = token.split(".");
    // atob returns binary string; escape+decodeURIComponent handles unicode safely enough here
    return JSON.parse(decodeURIComponent(escape(window.atob(payload))));
  } catch {
    return null;
  }
}
const truthy = (v) => v === true || v === 1 || v === "1" || v === "true";

export default function ProtectedRoute({ children, requireStaff = false }) {
  // 1) Hooks — always in the same order
  const { user: ctxUser, loading } = useAuth();
  const loc = useLocation();
  const [claims, setClaims] = useState(null);

  // 2) Read/parse token once (or when storage changes if you want to add a storage event)
  useEffect(() => {
    const raw =
      localStorage.getItem("staff_token") ||
      sessionStorage.getItem("staff_token") ||
      (JSON.parse(localStorage.getItem("auth.tokens") || "null") || {}).access ||
      localStorage.getItem("access") ||
      sessionStorage.getItem("access");
    if (raw) setClaims(parseJwt(raw));
    else setClaims(null);
  }, []); // do NOT gate this; keep hook order stable

  // 3) Derivations (also a hook; keep it unconditionally called)
  const { hydratedUser, isStaff } = useMemo(() => {
    const u = ctxUser ?? null;

    const ctxIsStaff =
      truthy(u?.is_staff) ||
      truthy(u?.is_superuser) ||
      u?.role === "staff" ||
      u?.role === "admin" ||
      (Array.isArray(u?.roles) && (u.roles.includes("staff") || u.roles.includes("admin")));

    const lsIsStaff =
      truthy(localStorage.getItem("is_staff")) ||
      truthy(sessionStorage.getItem("is_staff"));

    const jwtIsStaff =
      truthy(claims?.is_staff) ||
      truthy(claims?.is_superuser) ||
      claims?.role === "staff" ||
      claims?.role === "admin" ||
      (Array.isArray(claims?.groups) && (claims.groups.includes("staff") || claims.includes?.("admin")));

    return { hydratedUser: u, isStaff: ctxIsStaff || lsIsStaff || jwtIsStaff };
  }, [ctxUser, claims]);

  // 4) Now do conditional returns (AFTER all hooks)
  if (loading) return null; // or a spinner
  if (!hydratedUser) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (requireStaff && !isStaff) return <Navigate to="/" replace />;

  return children;
}
