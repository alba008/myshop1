// src/pages/Cart.jsx (golden theme to match Login)
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import http from "../lib/http";

import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia,
  Divider, IconButton, TextField, Stack, Skeleton, Alert, Chip,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";

// ---------- Shared theme tokens (gold-first like Login) ----------
const ui = {
  pageBg: "linear-gradient(to bottom right, #0b0b0e, #1c1917, #2a2523)",
  text: "rgba(255,255,255,.95)",
  subtext: "rgba(255,255,255,.75)",
  surface: "rgba(20, 20, 25, 0.85)", // glass layer
  border: "0.1px solid rgba(255, 215, 140, 0.60)",
  cardShadow: "0 0 25px rgba(255, 215, 150, 0.08)",
  radius: 5,
  gold: "#f5deb3",
  goldDeep: "#caa46c",
  goldGlow: "0 0 12px rgba(255,215,150,0.18)",
  inputIdle: "rgba(255,255,255,0.18)",
  inputHover: "rgba(255,215,150,0.4)",
  inputBg: "rgba(255,255,255,.10)",
  btnGrad: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
  btnGradHover: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
};

const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try { new URL(u); return u; } catch {
    return String(u).startsWith("/media/") ? u : `/media/${String(u).replace(/^\/+/, "")}`;
  }
};

const toNumber = (v) => {
  if (v == null) return 0;
  const s = String(v).replace(/,/g, "");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Cart() {
  const { cart, removeItem, updateItemQuantity, clearCart, reload } = useCart();
  const navigate = useNavigate();

  const [promo, setPromo] = useState("");
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState("");

  const items = useMemo(() => (Array.isArray(cart?.items) ? cart.items : []), [cart]);

  // --- Image cache: prefer product detail; fallback to product-images list
  const [imageMap, setImageMap] = useState({}); // { [product_id]: url|null }
  const inFlight = useRef(new Set()); // prevent duplicate concurrent fetches

  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    ids.forEach(async (id) => {
      if (imageMap[id] !== undefined || inFlight.current.has(id)) return;
      inFlight.current.add(id);
      try {
        // 1) Try product detail
        let url = null;
        let res = await fetch(`/api/products/${id}/`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          url = data?.image_url_resolved || null;
        }
        // 2) Fallback to first product image
        if (!url) {
          res = await fetch(`/api/product-images/?product=${id}&ordering=id`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const rows = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
            url = rows?.[0]?.image_url || null;
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

  // totals – prefer server, else compute from lines
  const subtotal = useMemo(
    () => (cart?.subtotal != null
            ? toNumber(cart.subtotal)
            : items.reduce((a, i) => a + toNumber(i.line_total), 0)),
    [cart?.subtotal, items]
  );
  const discount = toNumber(cart?.discount);
  const total = useMemo(
    () => (cart?.total != null ? toNumber(cart.total) : Math.max(0, subtotal - discount)),
    [cart?.total, subtotal, discount]
  );

  const handleQuantityChange = async (productId, delta) => {
    const it = items.find((i) => i.product_id === productId);
    if (!it) return;
    const next = (toNumber(it.quantity) || 1) + delta;
    if (next < 1) return;
    await updateItemQuantity(productId, next);
    await reload?.();
  };

  const applyCoupon = async () => {
    setErr("");
    if (!promo.trim()) return;
    try {
      setWorking(true);
      await http.post("/api/cart/coupon/", { code: promo.trim() });
      setPromo("");
      await reload?.();
    } catch (e) {
      setErr(e.message || "Invalid coupon");
    } finally {
      setWorking(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setWorking(true);
      await http.delete("/api/cart/coupon/");
      await reload?.();
    } finally {
      setWorking(false);
    }
  };

  // loading skeleton
  if (!cart) {
    return (
      <Box sx={{
        minHeight: "100vh",
        background: ui.pageBg,
        color: ui.text,
        py: { xs: 2, md: 4 },
      }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 } }}>
          <Skeleton width={220} height={32} sx={{ bgcolor: "rgba(255,255,255,.2)" }} />
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}><Skeleton variant="rounded" height={420} sx={{ bgcolor: "rgba(255,255,255,.12)" }} /></Grid>
            <Grid item xs={12} md={4}><Skeleton variant="rounded" height={240} sx={{ bgcolor: "rgba(255,255,255,.12)" }} /></Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  // empty state
  if (!items.length) {
    return (
      <Box
        sx={{
          minHeight: "90vh",
          display: "grid",
          placeItems: "center",
          background: ui.pageBg,
          color: ui.text,
          px: 2,
          p:{ sx: 90 }
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 56, opacity: 0.85 }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: ui.gold, fontFamily: "'Playfair Display', serif", textShadow: ui.goldGlow }}
          >
            Your cart is empty
          </Typography>
          <Typography sx={{ opacity: 0.85 }}>
            Add a few candles to bring the glow back ✨
          </Typography>
          <Button
            component={RouterLink}
            to="/shop"
            variant="contained"
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1.2,
              fontWeight: 800,
              textTransform: "none",
              background: ui.btnGrad,
              color: "#121212",
              boxShadow: "0 0 20px rgba(255,215,150,0.25)",
              ":hover": { background: ui.btnGradHover, boxShadow: "0 0 25px rgba(255,215,150,0.4)" },
            }}
          >
            Shop now
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: ui.pageBg, color: ui.text }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mb: 2,
            letterSpacing: 0.2,
            color: ui.gold,
            fontFamily: "'Playfair Display', serif",
            textShadow: ui.goldGlow,
          }}
        >
          Your Cart
        </Typography>

        <Grid container spacing={2} alignItems="flex-start">
          {/* LEFT: Items */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              {items.map((item, idx) => {
                const unit = toNumber(item.price ?? item.unit_price);
                const line = toNumber(item.line_total) || unit * toNumber(item.quantity);
                const fromMap = imageMap[item.product_id];
                const fallbackLineUrl = resolveUrl(item._image || item.product_image || item.image_url || item.image);
                const img = fromMap ?? fallbackLineUrl; // per-item resolved source

                return (
                  <Card
                    key={`cart-${item.product_id}-${idx}`}
                    elevation={0}
                    sx={{
                      display: "flex",
                      gap: 2,
                      p: 0.5,
                      borderRadius: ui.radius,
                      border: ui.border,
                      bgcolor: ui.surface,
                      backdropFilter: "blur(10px)",
                      boxShadow: ui.cardShadow,
                      transition: "transform .15s ease, box-shadow .15s ease",
                      ":hover": { transform: "translateY(-2px)", boxShadow: "0 16px 40px rgba(0,0,0,.35)" },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={img || "/media/placeholder.png"}
                      alt={item.name}
                      onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                      sx={{
                        width: 92,
                        height: 92,
                        objectFit: "cover",
                        borderRadius: 5,
                        border: ui.border,
                        flexShrink: 0,
                        backgroundColor: "rgba(0,0,0,.15)",
                      }}
                    />
                    <CardContent
                      sx={{
                        p: 1,
                        "&:last-child": { pb: 1 },
                        flex: 1,
                        minWidth: 0,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'white'  }} noWrap>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: ui.subtext }}>
                          Unit: {fmt(unit)}
                        </Typography>
                      </Box>

                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.product_id, -1)}
                          aria-label="decrease quantity"
                          sx={{ color: ui.text }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          size="small"
                          inputProps={{ style: { textAlign: "center", width: 40 }, readOnly: true, "aria-label": "quantity" }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: ui.inputBg,
                              color: ui.text,
                              "& fieldset": { borderColor: ui.inputIdle },
                              "&:hover fieldset": { borderColor: ui.inputHover },
                              "&.Mui-focused fieldset": {
                                borderColor: ui.gold,
                                boxShadow: ui.goldGlow,
                              },
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.product_id, 1)}
                          aria-label="increase quantity"
                          sx={{ color: ui.text }}
                        >
                          <AddIcon />
                        </IconButton>

                        <Divider flexItem orientation="vertical" sx={{ mx: 1, borderColor: "rgba(255,255,255,.12)" }} />

                        <Typography sx={{ fontWeight: 800, minWidth: 16, textAlign: "right", color:'white'  }}>
                          {fmt(line)}
                        </Typography>

                        <IconButton
                          color="error"
                          onClick={async () => { await removeItem(item.product_id); await reload?.(); }}
                          aria-label="remove from cart"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          {/* RIGHT: Summary */}
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: ui.radius,
                border: ui.border,
                bgcolor: ui.surface,
                backdropFilter: "blur(10px)",
                position: { md: "sticky" },
                top: { md: 24 },
                boxShadow: ui.cardShadow,
                mx:{xs:1},
                mb:{xs:7},
                width:{xs:200, md:300},
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: ui.gold }}>
                Order Summary
              </Typography>

              {err && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {err}
                </Alert>
              )}

              {/* Coupon */}
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Promo code"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOfferOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: ui.inputBg,
                      color: ui.text,
                      "& fieldset": { borderColor: ui.inputIdle },
                      "&:hover fieldset": { borderColor: ui.inputHover },
                      "&.Mui-focused fieldset": {
                        borderColor: ui.gold,
                        boxShadow: ui.goldGlow,
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={applyCoupon}
                  disabled={working || !promo.trim()}
                  sx={{
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    fontWeight: 800,
                    background: ui.btnGrad,
                    color: "white",
                    boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                    ":hover": { background: ui.btnGradHover, boxShadow: "0 0 25px rgba(255,215,150,0.4)" },
                  }}
                >
                  Apply
                </Button>
              </Stack>

              {cart?.coupon && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    label={`Coupon: ${cart.coupon.code} (-${cart.coupon.discount}%)`}
                    onDelete={removeCoupon}
                    variant="outlined"
                    color="success"
                    size="small"
                  />
                </Stack>
              )}

              <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,.12)" }} />

              <Row label="Subtotal" value={fmt(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`- ${fmt(discount)}`} muted />}
              <Row
                label={<Typography sx={{ fontWeight: 600, color:'white' }}>Total</Typography>}
                value={<Typography sx={{ fontWeight: 900, color:'white'  }}>{fmt(total)}</Typography>}
              />

              <Typography variant="caption" sx={{ display: "block", mt: 1.25, color: ui.subtext }}>
                Shipping & tax calculated at checkout.
              </Typography>

              <Stack spacing={1.25} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/checkout")}
                  sx={{
                    borderRadius: 999,
                    py: 1.2,
                    fontWeight: 800,
                    textTransform: "none",
                    background: ui.btnGrad,
                    color: "#121212",
                    boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                    ":hover": { background: ui.btnGradHover, boxShadow: "0 0 25px rgba(255,215,150,0.4)" },
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  component={RouterLink}
                  to="/shop"
                  variant="outlined"
                  sx={{
                    borderRadius: 999,
                    py: 1.1,
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,.25)",
                    color: ui.text,
                    ":hover": { borderColor: "rgba(255,255,255,.45)", bgcolor: "rgba(255,255,255,.06)" },
                  }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={clearCart}
                  sx={{ py: 1, textTransform: "none", fontWeight: 700 }}
                >
                  Clear Cart
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

function Row({ label, value, muted = false }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 0.5 }}>
      {typeof label === "string" ? (
        <Typography color={muted ? "text.secondary" : ui.text}>{label}</Typography>
      ) : (
        <Box>{label}</Box>
      )}
      {typeof value === "string" ? (
        <Typography color={muted ? "text.secondary" : ui.text}>{value}</Typography>
      ) : (
        <Box>{value}</Box>
      )}
    </Stack>
  );
}
