// src/contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const CartContext = createContext();

// Relative URLs so Vite proxy carries cookies/session
const CART_URL = `/api/cart/`;
const ITEM_URL = `/api/cart/item/`;

/* ---------- CSRF helpers ---------- */
function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()) : "";
}

async function ensureCsrf() {
  // if csrftoken doesn't exist yet, hit a GET endpoint to receive it via Set-Cookie
  if (!getCookie("csrftoken")) {
    try { await fetch(`/api/accounts/me/`, { credentials: "include" }); } catch {}
  }
}

async function jsonFetch(url, options = {}) {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken");
  const headers = {
    "Content-Type": "application/json",
    ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { credentials: "include", ...options, headers });
  return res;
}

/* ---------- misc helpers (unchanged) ---------- */
const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try { new URL(u); return u; } catch {
    return String(u).startsWith("/media/") ? u : `/media/${String(u).replace(/^\/+/, "")}`;
  }
};

async function readJson(res) {
  if (!res) return null;
  if (res.status === 204) return null;
  const ct = res.headers?.get?.("content-type") || "";
  const text = await res.text();
  if (!text) return null;
  if (ct.includes("application/json")) {
    try { return JSON.parse(text); } catch {}
  }
  return null;
}

function normalizeCart(raw) {
  const cart = raw || { items: [], subtotal: "0.00", total: "0.00", discount: "0.00" };
  const items = Array.isArray(cart.items)
    ? cart.items.map((it) => ({ ...it, _image: resolveUrl(it._image || it.product_image || it.image || it.image_url) }))
    : [];
  const derivedCount = items.reduce((n, it) => n + (Number(it.quantity) || 0), 0);
  const count =
    typeof cart.cart_count === "number" ? cart.cart_count
    : typeof cart.count === "number" ? cart.count
    : derivedCount;
  return {
    items,
    subtotal: cart.subtotal ?? "0.00",
    discount: cart.discount ?? "0.00",
    total: cart.total ?? cart.subtotal ?? "0.00",
    coupon: cart.coupon ?? null,
    count,
    cart_count: count,
  };
}

/* ---------- provider ---------- */
export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: "0.00", total: "0.00", discount: "0.00", count: 0, cart_count: 0 });
  const loadingRef = useRef(false);

  const reload = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = await fetch(CART_URL, { credentials: "include", headers: { "Cache-Control": "no-store" } });
      const data = await readJson(res);
      setCart(normalizeCart(data));
    } finally {
      loadingRef.current = false;
    }
  };

  const setFromResponse = async (res) => {
    const data = await readJson(res);
    if (data) setCart(normalizeCart(data));
    else await reload();
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") reload(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ---------- mutations now send CSRF ---------- */
  const addItem = async (productId, quantity = 1) => {
    const res = await jsonFetch(ITEM_URL, {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    await setFromResponse(res);
  };

  const updateItemQuantity = async (productId, quantity) => {
    let res;
    try {
      res = await jsonFetch(ITEM_URL, {
        method: "PATCH",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      if (!res.ok) throw new Error();
    } catch {
      res = await jsonFetch(ITEM_URL, {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
    }
    await setFromResponse(res);
  };

  const removeItem = async (productId) => {
    const res = await jsonFetch(ITEM_URL, {
      method: "DELETE",
      body: JSON.stringify({ product_id: productId }),
    });
    await setFromResponse(res);
  };

  const clearCart = async () => {
    const res = await jsonFetch(CART_URL, { method: "DELETE" });
    await setFromResponse(res);
  };

  const value = useMemo(() => ({
    cart,
    count: cart?.count ?? 0,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    reload,
  }), [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
