// src/lib/authFetch.js
function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function getAccessToken() {
    return (
      localStorage.getItem('access') ||
      localStorage.getItem('jwt_access') ||
      localStorage.getItem('token') ||
      ''
    );
  }
  
  const SAFE = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
  
  export default async function authFetch(url, opts = {}) {
    const method = (opts.method || 'GET').toUpperCase();
    const headers = new Headers(opts.headers || {});
    const access = getAccessToken();
    const isMultipart = opts.body instanceof FormData;
  
    // JWT if present
    if (access && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  
    // CSRF for unsafe methods when using cookies
    if (!SAFE.has(method)) {
      const csrf = getCookie('csrftoken');     // or whatever your cookie is named
      if (csrf) headers.set('X-CSRFToken', csrf);
      headers.set('X-Requested-With', 'XMLHttpRequest');
    }
  
    // Only set Content-Type for JSON bodies; FormData sets its own boundary
    if (!isMultipart && opts.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  
    const res = await fetch(url, {
      credentials: 'include',    // keep session cookie
      ...opts,
      headers,
    });
    return res;
  }
  