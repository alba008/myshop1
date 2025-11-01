// src/staff/api.js
import { fetchWithAuth } from "../lib/fetchWithAuth"; // <-- named import

export async function apiGet(path, { jwt } = {}) {
  const res = await fetchWithAuth(path, { method: "GET", jwt });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

export async function apiSend(method, path, body, { jwt } = {}) {
  const res = await fetchWithAuth(path, { method, body, jwt });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}
