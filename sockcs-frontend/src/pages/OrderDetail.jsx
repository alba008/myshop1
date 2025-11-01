// src/pages/OrdersHub.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Alert, Skeleton, Divider, CardMedia, Chip } from "@mui/material";
import http from "../lib/http";

const GOLD = "#f5deb3", GOLD_BORDER = "rgba(245,222,179,.35)";
const PAGE_BG = "linear-gradient(180deg, #0e0f12 0%, #14161a 100%)";
const FRAME_BG = "rgba(255,255,255,.06)", FRAME_BORDER = "rgba(255,255,255,.10)";
const TEXT_MAIN = "rgba(255,255,255,.96)", TEXT_MID = "rgba(255,255,255,.78)";
const money = (v) => Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const resolveMedia = (u) => !u ? "/media/placeholder.png" : (/^https?:\/\//i.test(u) || u.startsWith("/media/")) ? u : `/media/${String(u).replace(/^\/+/, "")}`;

function normalize(raw) {
  const d = raw || {};
  const items = (Array.isArray(d.items) ? d.items : []).map((it, i) => {
    const price = num(it.price ?? it.unit_price), qty = num(it.quantity);
    return {
      product_id: it.product_id ?? it.id ?? i,
      name: it.name || it.product_name || `Item ${i + 1}`,
      product_image: resolveMedia(it.product_image || it.image_url || it.thumbnail || it._image || it.image),
      price, quantity: qty, line_total: num(it.line_total ?? price * qty),
    };
  });
  const subtotal = num(d.subtotal ?? items.reduce((a, x) => a + x.line_total, 0));
  const discount = num(d.discount);
  const total = num(d.total ?? Math.max(0, subtotal - discount));
  return { ...d, items, subtotal, discount, total };
}

export default function OrdersHub() {
  const loc = useLocation();
  const qs = new URLSearchParams(loc.search);
  const hinted = qs.get("order") || "";
  const [inputId, setInputId] = useState(hinted || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const lastId = localStorage.getItem("last_order_id") || "";

  useEffect(() => {
    (async () => {
      let id = hinted || null;
      if (!id) {
        try { const hint = await http.get("/api/orders/thank-you/"); if (hint?.order) id = String(hint.order); } catch {}
      }
      if (!id) id = lastId || null;
      if (id) { setInputId(id); await load(id); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(id) {
    if (!id) return;
    setLoading(true); setErr("");
    try {
      const detail = await http.get(`/api/orders/${encodeURIComponent(id)}/`);
      const n = normalize(detail);
      setOrder(n);
      localStorage.setItem("last_order_id", String(n.id || id));
    } catch (e) {
      setOrder(null);
      setErr(e.message || "Order not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Card elevation={0} sx={{ borderRadius: 3,  mb: { xs: 8 }, border: `1px solid ${FRAME_BORDER}`, bgcolor: FRAME_BG, backdropFilter: "blur(8px)" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: GOLD, mb: 0.5 }}>Order Details</Typography>
            <Typography variant="body2" sx={{ color: TEXT_MID, mb: 2 }}>Auto-loads your latest order; you can also search by number.</Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mb: 2 }}>
              <TextField
                size="small" label="Order #"
                value={inputId} onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e)=> { if (e.key === "Enter") load(inputId.trim()); }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.04)",
                    color: TEXT_MAIN,
                    "& fieldset": { borderColor: GOLD_BORDER },
                    "&:hover fieldset": { borderColor: GOLD },
                    "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(245,222,179,.25)" },
                  },
                  "& .MuiInputLabel-root": { color: TEXT_MID },
                }}
              />
              <Button
                variant="contained"
                onClick={() => load(inputId.trim())}
                disabled={!inputId.trim() || loading}
                sx={{
                  px: 3, borderRadius: 999, fontWeight: 900,
                  background: `linear-gradient(90deg, ${GOLD}, #caa46c, ${GOLD})`,
                  color: "#121212",
                  "&:hover": { background: `linear-gradient(90deg, #caa46c, ${GOLD}, #caa46c)` },
                }}
              >
                View
              </Button>
              <Button component={Link} to="/shop" variant="outlined"
                sx={{ borderRadius: 999, px: 2.5, color: GOLD, borderColor: GOLD_BORDER, "&:hover": { borderColor: GOLD } }}>
                Continue shopping
              </Button>
            </Stack>

            {lastId && (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={`Recent: #${lastId}`}
                  variant="outlined"
                  onClick={() => { setInputId(lastId); load(lastId); }}
                  sx={{ color: GOLD, borderColor: GOLD_BORDER, cursor: "pointer" }}
                />
              </Stack>
            )}

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

            {loading ? (
              <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3, bgcolor: "rgba(255,255,255,.08)" }} />
            ) : order ? (
              <>
                <Divider sx={{ my: 1.5, borderColor: GOLD_BORDER }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 900, color: GOLD }}>Order #{order.id}</Typography>
                  {order.paid != null && (
                    <Chip size="small" label={order.paid ? "Paid" : "Unpaid"} variant="outlined" sx={{ color: GOLD, borderColor: GOLD_BORDER }} />
                  )}
                </Stack>

                <Stack spacing={1}>
                  {order.items.map((it, i) => (
                    <Card key={`${it.product_id || i}-${i}`} elevation={0}
                      sx={{
                        display: "grid", gridTemplateColumns: "80px 1fr auto",
                        gap: 1.25, alignItems: "center", p: 1.25,
                        borderRadius: 2, border: `1px solid ${FRAME_BORDER}`,
                        bgcolor: "rgba(255,255,255,.04)",
                      }}>
                      <CardMedia
                        component="img"
                        image={it.product_image}
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

                <Divider sx={{ my: 1.5, borderColor: GOLD_BORDER }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 900, color: GOLD }}>Subtotal</Typography>
                  <Typography >{money(order.subtotal)}</Typography>
                </Stack>
                {!!order.discount && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: TEXT_MID }}>Discount</Typography>
                    <Typography sx={{ color: TEXT_MID }}>- {money(order.discount)}</Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontWeight: 900, color: GOLD }}>Total</Typography>
                  <Typography sx={{ fontWeight: 900, color: GOLD }}>{money(order.total)}</Typography>
                </Stack>

                <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
                <Button
  component={Link}
  to={`/orders?order=${order.id}`}
  variant="contained"
  sx={{
    borderRadius: 999,
    px: 2.5,
    color: "black",
    background: `linear-gradient(90deg, ${GOLD}, #caa46c, ${GOLD})`,

    borderColor: GOLD_BORDER,
    "&:hover": { borderColor: GOLD }
  }}
>
  View Order
</Button>

                </Stack>
              </>
            ) : (
              <Alert severity="info">Enter an order number to view details.</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
