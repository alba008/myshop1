// src/pages/ThankYou.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Stack, Button, Divider,
  Breadcrumbs, Chip, CardMedia, Skeleton, Alert,
} from "@mui/material";
import { useCart } from "../contexts/CartContext";

/* ---- Theme ---- */
const GOLD = "#f5deb3";
const GOLD_BORDER = "rgba(245,222,179,.35)";
const PAGE_BG = "linear-gradient(180deg, #0e0f12 0%, #14161a 100%)";
const FRAME_BG = "rgba(255,255,255,.06)";
const FRAME_BORDER = "rgba(255,255,255,.10)";
const TEXT_MAIN = "rgba(255,255,255,.96)";
const TEXT_MID = "rgba(255,255,255,.78)";

/* ---- Helpers ---- */
const money = (v) => Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const asNumber = (v) => { const n = Number(String(v ?? 0).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
const resolveMedia = (u) => {
  if (!u) return "/media/placeholder.png";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/media/")) return s;
  return `/media/${s.replace(/^\/+/, "")}`;
};

const safeGet = async (url) => {
  const res = await fetch(url, { credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  let data = null; try { data = ct.includes("application/json") ? await res.json() : null; } catch {}
  return { ok: res.ok, status: res.status, data, headers: res.headers };
};

const fetchOrderItems = async (orderId) => {
  // Try nested items endpoint
  let r = await safeGet(`/api/orders/${orderId}/items/`);
  if (r.ok && (Array.isArray(r.data) || Array.isArray(r.data?.results))) {
    return Array.isArray(r.data) ? r.data : r.data.results;
  }
  // Try flat resource
  r = await safeGet(`/api/order-items/?order=${encodeURIComponent(orderId)}&page_size=200`);
  if (r.ok && (Array.isArray(r.data) || Array.isArray(r.data?.results))) {
    return Array.isArray(r.data) ? r.data : r.data.results;
  }
  // Try alternate path
  r = await safeGet(`/api/orders/${orderId}/lines/`);
  if (r.ok && (Array.isArray(r.data) || Array.isArray(r.data?.results))) {
    return Array.isArray(r.data) ? r.data : r.data.results;
  }
  return [];
};

const pickIdFromSession = async () => {
  try {
    const res = await fetch(`/api/session/`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.last_order_id ? String(data.last_order_id) : null;
  } catch { return null; }
};

function normalizeOrder(raw, idOverride) {
  const d = raw || {};
  let items = Array.isArray(d.items) ? d.items : [];
  items = items.map((it, i) => {
    const price = asNumber(it.price ?? it.unit_price);
    const qty = asNumber(it.quantity);
    const line_total = asNumber(it.line_total ?? price * qty);
    const name = it.name || it.product_name || `Item ${i + 1}`;
    const img = it.product_image || it.image_url || it.thumbnail || it._image || it.image;
    return {
      product_id: it.product_id ?? it.product ?? it.id ?? i,
      name,
      price,
      quantity: qty,
      line_total,
      product_image: resolveMedia(img),
    };
  });
  const subtotal = asNumber(d.subtotal ?? items.reduce((a, x) => a + x.line_total, 0));
  const discount = asNumber(d.discount);
  const total = asNumber(d.total ?? Math.max(0, subtotal - discount));
  return { ...d, id: idOverride ?? d.id ?? null, items, subtotal, discount, total };
}

export default function ThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const idFromQuery = q.get("order");
  const [order, setOrder] = useState(null);
  const [capturedId, setCapturedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // ---- cart actions (RE-USE YOUR CONTEXT) ----
  const { clearCart, reload } = useCart();

  // Run exactly once per order id (prevents duplicate clears on re-renders/polls)
  async function clearCartOnce(orderId) {
    if (!orderId) return;
    const flag = `cart_cleared_for_order_${orderId}`;
    if (sessionStorage.getItem(flag)) return;
    try {
      await clearCart();     // DELETE /api/cart/
      await reload();        // refresh context so header badge updates
      const bc = new BroadcastChannel("cart");
      bc.postMessage({ type: "cart:cleared", orderId });
      bc.close();
      sessionStorage.setItem(flag, "1");
    } catch {
      // swallow; the order UI still renders
    }
  }

  useEffect(() => {
    let alive = true;
    let poll = null;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        // 1) Resolve an order id (URL → /api/session/ → fallback endpoints)
        let id = idFromQuery || null;

        if (!id) {
          id = await pickIdFromSession();
        }
        if (!id) {
          const t = await safeGet(`/api/orders/thank-you/`); // expects { order: <id> }
          if (t.ok && t.data?.order) id = String(t.data.order);
        }
        let full = null;
        if (!id) {
          const last = await safeGet(`/api/orders/last/?full=1`);
          if (last.ok && last.data?.id) {
            id = String(last.data.id);
            full = normalizeOrder(last.data, id);
          }
        }
        if (!id) throw new Error("No order id available.");

        setCapturedId(id);
        localStorage.setItem("last_order_id", id);

        // 2) Fetch order detail; ensure items
        if (!full) {
          const d = await safeGet(`/api/orders/${id}/`);
          if (!alive) return;
          if (!d.ok || !d.data) throw new Error(d.data?.detail || `Order ${id} not found`);
          full = normalizeOrder(d.data, id);
        }
        if (!full.items?.length) {
          const it = await fetchOrderItems(id);
          if (Array.isArray(it) && it.length) {
            full = normalizeOrder({ ...full, items: it }, id);
          }
        }

        if (!alive) return;
        setOrder(full);

        // 2b) CLEAR CART immediately now that we have an order id (common success flow)
        clearCartOnce(id);

        // 3) Light poll for "paid" flip (3s × up to ~1 min)
        let tries = 0;
        poll = setInterval(async () => {
          tries += 1;
          try {
            const fresh = await safeGet(`/api/orders/${id}/`);
            if (fresh.ok && alive) {
              setOrder(prev => normalizeOrder({ ...prev, ...fresh.data }, id));

              if (fresh.data?.paid) {
                // ensure cart is cleared when payment confirms
                clearCartOnce(id);
                clearInterval(poll);
              } else if (tries >= 20) {
                clearInterval(poll);
              }
            }
          } catch {
            if (tries >= 20) clearInterval(poll);
          }
        }, 3000);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load order");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; if (poll) clearInterval(poll); };
  }, [idFromQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- UI ----------
  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = asNumber(order?.subtotal);
  const discount = asNumber(order?.discount);
  const total = asNumber(order?.total ?? Math.max(0, subtotal - discount));
  const customerName = useMemo(
    () => [order?.first_name, order?.last_name].filter(Boolean).join(" "),
    [order?.first_name, order?.last_name]
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
        <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
          <Skeleton width={220} height={36} sx={{ bgcolor: FRAME_BG }} />
          <Skeleton variant="rounded" height={300} sx={{ mt: 2, borderRadius: 3, bgcolor: FRAME_BG }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 }, pb: { xs: 10 } }}>
      

        {/* Card */}
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${FRAME_BORDER}`, bgcolor: FRAME_BG, backdropFilter: "blur(8px)" }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* tiny diagnostic */}
            <Typography variant="caption" sx={{ color: TEXT_MID, display: "block", mb: 1 }}>
              captured order id: <strong style={{ color: GOLD }}>{capturedId || "(none)"}</strong>
            </Typography>

            <Stack spacing={0.5}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: GOLD, fontFamily: "'Playfair Display', serif" }}>
                {customerName ? `Thank you, ${customerName}!` : "Thank you!"}
              </Typography>
              <Typography sx={{ color: TEXT_MID }}>
                {order?.id
                  ? `Your order #${order.id} was created. A receipt was sent to ${order?.email || "your email"}.`
                  : `Your order was created.`}
              </Typography>
              {order?.paid != null && (
                <Chip
                  size="small"
                  label={order.paid ? "Paid" : "Awaiting payment confirmation…"}
                  sx={{ alignSelf: "flex-start", color: GOLD, borderColor: GOLD_BORDER }}
                  variant="outlined"
                />
              )}
            </Stack>

            {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

            {/* Items */}
            <Divider sx={{ my: 2, borderColor: GOLD_BORDER }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: GOLD }}>
              Order items
            </Typography>

            {items.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                We didn’t receive line items from the server for order #{order?.id ?? "—"}.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {items.map((it, i) => (
                  <Card key={`${it.product_id || i}-${i}`} elevation={0}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr auto",
                      gap: 1.25,
                      alignItems: "center",
                      p: 1.25,
                      borderRadius: 2,
                      border: `1px solid ${FRAME_BORDER}`,
                      bgcolor: "rgba(255,255,255,.04)",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={resolveMedia(it.product_image)}
                      alt={it.name}
                      onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1.5, border: `1px solid ${GOLD_BORDER}` }}
                    />
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: GOLD }} noWrap title={it.name}>
                        {it.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: TEXT_MID }}>
                        Unit: {money(it.price)} • Qty: {it.quantity}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: GOLD, minWidth: 96, textAlign: "right" }}>
                      {money(it.line_total)}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Totals */}
            <Divider sx={{ my: 2, borderColor: GOLD_BORDER }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography>Subtotal</Typography>
              <Typography>{money(subtotal)}</Typography>
            </Stack>
            {discount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: TEXT_MID }}>Discount</Typography>
                <Typography sx={{ color: TEXT_MID }}>- {money(discount)}</Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography sx={{ fontWeight: 900, color: GOLD }}>Total</Typography>
              <Typography sx={{ fontWeight: 900, color: GOLD }}>{money(total)}</Typography>
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
              <Button
                component={Link}
                to="/shop"
                variant="contained"
                sx={{
                  borderRadius: 999, px: 3, fontWeight: 900,
                  background: `linear-gradient(90deg, ${GOLD}, #caa46c, ${GOLD})`,
                  color: "#121212", boxShadow: "0 0 18px rgba(255,215,150,.25)",
                  "&:hover": { background: `linear-gradient(90deg, #caa46c, ${GOLD}, #caa46c)` },
                }}
              >
                Continue shopping
              </Button>
              {order?.id && (
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/orders?order=${order.id}`)}
                  sx={{ borderRadius: 999, px: 2.5, color: GOLD, borderColor: GOLD_BORDER, "&:hover": { borderColor: GOLD } }}
                >
                  View order
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
