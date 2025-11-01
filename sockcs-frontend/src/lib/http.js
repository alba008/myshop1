// src/lib/http.js
const BASE = import.meta.env.VITE_API_BASE || ""; // proxy in dev

function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m.pop() : '';
}

async function parseBody(res) {
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text) return null;
  if (ct.includes("application/json")) {
    try { return JSON.parse(text); } catch { return text; }
  }
  return text;
}

/**
 * api(path, options)
 * options.returnMeta === true -> returns { data, status, headers }
 */
export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const csrftoken = getCookie("csrftoken");
  if (csrftoken && !headers["X-CSRFToken"]) headers["X-CSRFToken"] = csrftoken;

  const res = await fetch(`${BASE}${path}`, {
    credentials: options.credentials ?? "include",
    headers,
    ...options,
  });

  const data = await (res.ok ? parseBody(res) : res.text().catch(() => ""));

  if (!res.ok) {
    const msg = (typeof data === "string" && data) || (data && data.detail) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (options.returnMeta) {
    const hdrs = {};
    // normalize headers to lower-case keys
    for (const [k, v] of res.headers.entries()) hdrs[k.toLowerCase()] = v;
    return { data, status: res.status, headers: hdrs };
  }
  return data;
}

const http = {
  get: (p, opts) => api(p, { method: "GET", ...(opts || {}) }),
  post: (p, body, opts) => api(p, { method: "POST", body: JSON.stringify(body ?? {}), ...(opts || {}) }),
  patch: (p, body, opts) => api(p, { method: "PATCH", body: JSON.stringify(body ?? {}), ...(opts || {}) }),
  delete: (p, body, opts) =>
    api(p, { method: "DELETE", body: body ? JSON.stringify(body) : undefined, ...(opts || {}) }),

  // helpers that *always* return meta (data + headers)
  getMeta: (p, opts) => api(p, { method: "GET", returnMeta: true, ...(opts || {}) }),
  postMeta: (p, body, opts) => api(p, { method: "POST", body: JSON.stringify(body ?? {}), returnMeta: true, ...(opts || {}) }),
};

export default http;
