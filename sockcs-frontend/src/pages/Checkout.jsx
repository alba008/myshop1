// src/pages/Checkout.jsx (uses Cart image-fetch logic + golden theme)
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, Stack,
  Divider, Alert, Breadcrumbs, Skeleton, Chip, CardMedia,
} from "@mui/material";
import http from "../lib/http";

/* ---------- Theme (golden, consistent with Login/Cart) ---------- */
const GOLD = "#f5deb3";
const GOLD_BORDER = "rgba(245,222,179,.35)";
const PAGE_BG = "linear-gradient(to bottom right, #0b0b0e, #1c1917, #2a2523)";
const FRAME_BG = "rgba(20,20,25,.85)";
const FRAME_BORDER = "rgba(255,215,140,.20)";
const TEXT_MAIN = "rgba(255,255,255,.96)";
const TEXT_MID = "rgba(255,255,255,.78)";

/* ---------- helpers ---------- */
// Optionally rewrite media URLs to the current API origin if you do that elsewhere
const sameOrigin = (u) => u; // no-op here; plug in if needed

const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try { return sameOrigin(new URL(u).toString()); } catch {
    const s = String(u).trim();
    if (s.startsWith("/media/")) return sameOrigin(s);
    if (/^(products|marketing|gallery)\//i.test(s)) return sameOrigin(`/media/${s}`);
    if (/^[\w\-]+\.(jpe?g|png|gif|webp)$/i.test(s)) return sameOrigin(`/media/${s}`);
    return s;
  }
};

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const toNumber = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Normalize ANY cart shape into a stable one the UI can render
function normalizeCart(raw) {
  const c = raw || {};
  const src = Array.isArray(c.items) ? c.items : [];
  const items = src.map((it) => {
    const qty  = Number(it.quantity ?? it.qty ?? 0);
    const unit = toNumber(it.price ?? it.unit_price ?? 0);
    const line = toNumber(it.line_total ?? unit * qty);
    const name = it.name ?? it.product_name ?? `Item ${it.product_id ?? ""}`;
    const imgRaw = it.product_image || it.image_url || it.thumbnail || it._image || it.image || "";
    return {
      product_id: it.product_id ?? it.id,
      name,
      quantity: qty,
      price: unit,
      line_total: line,
      _image_abs: resolveUrl(imgRaw), // provisional; will be replaced by imageMap below
    };
  });

  // Prefer backend totals if provided
  const subtotal = toNumber(c.subtotal) || items.reduce((a, i) => a + i.line_total, 0);
  const discount = toNumber(c.discount);
  const total = toNumber(c.total) || Math.max(0, subtotal - discount);

  return { items, subtotal, discount, total, raw: c };
}

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [debug, setDebug] = useState(null);

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postal_code, setPostal] = useState("");
  const [city, setCity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // --- Image map (borrowed from Cart.jsx) ---
  const [imageMap, setImageMap] = useState({}); // { [product_id]: url|null }
  const inFlight = useRef(new Set());

  // Load cart summary
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      setDebug(null);
      try {
        const c = await http.get("/api/cart/", { credentials: "include" });
        const n = normalizeCart(c);
        setCart(n);
        if (!n.items.length) {
          setDebug({ note: "Cart has no items; showing raw payload", raw: c });
        }
      } catch (e) {
        setErr(e.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch BEST images by product id (detail → product-images fallback)
  const items = cart?.items ?? [];
  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    ids.forEach(async (id) => {
      if (imageMap[id] !== undefined || inFlight.current.has(id)) return;
      inFlight.current.add(id);
      try {
        let url = null;
        // 1) Try product detail
        let res = await fetch(`/api/products/${id}/`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          url = data?.image_url_resolved || data?.image || null;
        }
        // 2) Fallback to first product image
        if (!url) {
          res = await fetch(`/api/product-images/?product=${id}&ordering=id`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const rows = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
            url = rows?.[0]?.image_url || rows?.[0]?.image || null;
          }
        }
        setImageMap((m) => ({ ...m, [id]: url }));
      } catch {
        setImageMap((m) => ({ ...m, [id]: null }));
      } finally {
        inFlight.current.delete(id);
      }
    });
  }, [items, imageMap]);

  // Derived totals
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount ?? 0;
  const total = cart?.total ?? subtotal - discount;
  const disabled = !items.length || submitting;

  const submitOrder = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    if (!first_name || !last_name || !email || !address || !postal_code || !city) {
      setErr("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }
    if (!items.length) {
      setErr("Your cart is empty.");
      setSubmitting(false);
      return;
    }

    try {
      const order = await http.post(
        "/api/orders/",
        { first_name, last_name, email, address, postal_code, city },
        { credentials: "include" }
      );
      const orderId = order?.id || order?.order_id;

      let stripeUrl = null;
      try {
        const s1 = await http.post(
          "/api/checkout/stripe-session/",
          orderId ? { order_id: orderId } : {},
          { credentials: "include" }
        );
        if (s1?.url) stripeUrl = s1.url;
      } catch {}

      if (!stripeUrl) {
        try {
          const s2 = await http.post(
            "/api/checkout/stripe-session/",
            {},
            { credentials: "include" }
          );
          if (s2?.url) stripeUrl = s2.url;
        } catch {}
      }

      if (stripeUrl) {
        window.location.assign(stripeUrl);
        return;
      }

      navigate(`/orders/thank-you${orderId ? `?order=${orderId}` : ""}`);
    } catch (e2) {
      setErr(e2.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
        <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
          <Skeleton width={220} height={28} sx={{ bgcolor: FRAME_BG }} />
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={7}>
              <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3, bgcolor: FRAME_BG }} />
            </Grid>
            <Grid item xs={12} md={5}>
              <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, bgcolor: FRAME_BG }} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  /* ---------- UI ---------- */
  return (
    <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mb: { xs: 10 }, p: { xs: 2, md: 4 } }}>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {debug && (
          <Card sx={{ mb: 2, borderRadius: 2, border: `1px dashed ${GOLD_BORDER}`, bgcolor: "rgba(255,255,255,.03)" }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, color: GOLD }}>Debug</Typography>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12, color: TEXT_MID }}>
                {JSON.stringify(debug, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Breadcrumb */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 14, color: TEXT_MAIN }}>
            <Link to="/shop" style={{ color: "inherit", textDecoration: "none" }}>Shop</Link>
            <Link to="/cart" style={{ color: "inherit", textDecoration: "none" }}>Cart</Link>
            <span style={{ color: TEXT_MAIN }}>Checkout</span>
          </Breadcrumbs>
        </Stack>

        {/* Header strip */}
        <Card elevation={0} sx={{
          mb: 2.5, borderRadius: 3, border: `1px solid ${FRAME_BORDER}`,
          bgcolor: FRAME_BG, backdropFilter: "blur(8px)"
        }}>
          <CardContent sx={{ py: 1.25, px: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Chip size="small" label="Secure checkout" sx={{ color: GOLD, borderColor: GOLD_BORDER }} variant="outlined" />
                <Typography variant="body2" sx={{ color: TEXT_MID }}>
                  Free returns • 24/7 support
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: TEXT_MID }}>
                {items.length} item{items.length === 1 ? "" : "s"} in cart
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} alignItems="flex-start">
          {/* LEFT: Form */}
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{
              borderRadius: 3, border: `1px solid ${FRAME_BORDER}`,
              bgcolor: FRAME_BG, backdropFilter: "blur(8px)"
            }}>
              <CardContent component="form" onSubmit={submitOrder} sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: GOLD }}>
                  Shipping details
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    size="small" fullWidth label="First name" value={first_name}
                    onChange={(e) => setFirstName(e.target.value)} required
                    sx={goldFieldSx}
                  />
                  <TextField
                    size="small" fullWidth label="Last name" value={last_name}
                    onChange={(e) => setLastName(e.target.value)} required
                    sx={goldFieldSx}
                  />
                </Stack>

                <TextField size="small" fullWidth label="Email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mt: 2, ...goldFieldSx }} />
                <TextField size="small" fullWidth label="Address"
                  value={address} onChange={(e) => setAddress(e.target.value)} required sx={{ mt: 2, ...goldFieldSx }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                  <TextField size="small" fullWidth label="Postal code" value={postal_code} onChange={(e) => setPostal(e.target.value)} required sx={goldFieldSx} />
                  <TextField size="small" fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} required sx={goldFieldSx} />
                </Stack>

                <Divider sx={{ my: 2.5, borderColor: GOLD_BORDER }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button type="submit" variant="contained" size="large" disabled={disabled}
                    sx={{
                      borderRadius: 999, px: 3, fontWeight: 900,
                      background: `linear-gradient(90deg, ${GOLD}, #caa46c, ${GOLD})`,
                      color: "#121212",
                      boxShadow: "0 0 18px rgba(255,215,150,.25)",
                      "&:hover": { background: `linear-gradient(90deg, #caa46c, ${GOLD}, #caa46c)` },
                    }}>
                    {submitting ? "Placing order…" : "Place order"}
                  </Button>
                  <Button type="button" variant="text" disabled={submitting} onClick={() => navigate("/cart")} sx={{ color: GOLD }}>
                    Back to cart
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT: Order summary (image + details per product) */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{
              borderRadius: 3, border: `1px solid ${FRAME_BORDER}`,
              bgcolor: FRAME_BG, backdropFilter: "blur(8px)",
              position: { md: "sticky" }, top: { md: 24 }
            }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5, color: GOLD }}>
                  Order summary
                </Typography>

                <Stack spacing={1.25} sx={{ mb: 1.5 }}>
                  {items.map((it, i) => {
                    const resolved = imageMap[it.product_id] ?? it._image_abs;
                    return (
                      <Card key={`${it.product_id}-${i}`} elevation={0}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "72px 1fr auto",
                          gap: 1, alignItems: "center",
                          p: 1, borderRadius: 2,
                          border: `1px solid ${FRAME_BORDER}`,
                          bgcolor: "rgba(255,255,255,.04)",
                        }}>
                        <CardMedia
                          component="img"
                          image={resolved || "/media/placeholder.png"}
                          alt={it.name}
                          onError={(e) => { e.currentTarget.src = "/media/placeholder.png"; }}
                          sx={{
                            width: 72, height: 72, objectFit: "cover",
                            borderRadius: 1.5, border: `1px solid ${GOLD_BORDER}`,
                          }}
                        />
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: GOLD }} noWrap title={it.name}>
                            {it.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MID }}>
                            Unit: {fmtMoney(it.price)} • Qty: {it.quantity}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: GOLD, textAlign: "right", minWidth: 84 }}>
                          {fmtMoney(it.line_total)}
                        </Typography>
                      </Card>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 1.5, borderColor: GOLD_BORDER }} />

                <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 800,  color: GOLD  }}>
                  <Typography>Subtotal</Typography>
                  <Typography>{fmtMoney(subtotal)}</Typography>
                </Stack>
                {discount > 0 && (
                  <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 800 }}>
                    <Typography sx={{ color: TEXT_MID }}>Discount</Typography>
                    <Typography sx={{ color: TEXT_MID }}>- {fmtMoney(discount)}</Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 900, mt: 1 }}>
                  <Typography sx={{ color: GOLD }}>Total</Typography>
                  <Typography sx={{ color: GOLD }}>{fmtMoney(total)}</Typography>
                </Stack>

                <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: TEXT_MID }}>
                  Shipping & tax calculated at payment.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

/* gold outline for fields on dark bg */
const goldFieldSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    color: TEXT_MAIN,
    "& fieldset": { borderColor: GOLD_BORDER },
    "&:hover fieldset": { borderColor: GOLD },
    "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(245,222,179,.25)" },
  },
  "& .MuiInputLabel-root": { color: TEXT_MID },
  "& .MuiInputBase-input": { color: TEXT_MAIN },
};
