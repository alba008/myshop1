import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, TextField, Button, Stack, Divider, Alert,
  IconButton, InputAdornment, Grid, Chip, Skeleton, CardMedia, Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReplayIcon from "@mui/icons-material/Replay";

/* ===== Theme ===== */
const GOLD = "#f5deb3";
const GOLD_BORDER = "rgba(245,222,179,.35)";
const PAGE_BG = "linear-gradient(to bottom right, #0b0b0e, #1c1917, #2a2523)";
const FRAME_BG = "rgba(20,20,25,.85)";
const FRAME_BORDER = "rgba(255,215,140,.20)";
const TEXT_MAIN = "rgba(255,255,255,.96)";
const TEXT_MID = "rgba(255,255,255,.78)";

/* ===== Utils ===== */
const fmtMoney = (v) => Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const toNum = (v) => { const n = Number(String(v ?? 0).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
const resolveUrl = (u) => (!u ? "/media/placeholder.png" : String(u));

const safeGet = async (url) => {
  const res = await fetch(url, { credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  let data = null;
  try { data = ct.includes("application/json") ? await res.json() : null; } catch {}
  return { ok: res.ok, status: res.status, data, headers: res.headers };
};

const pickIdFromSession = async () => {
  try {
    const res = await fetch(`/api/session/`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.last_order_id ? String(data.last_order_id) : null;
  } catch { return null; }
};

const fetchBestImage = async (productId) => {
  try {
    let res = await fetch(`/api/products/${productId}/`, { credentials: "include" });
    if (res.ok) {
      const d = await res.json();
      if (d?.image_url_resolved || d?.image_url || d?.image) {
        return d.image_url_resolved || d.image_url || d.image;
      }
    }
    res = await fetch(`/api/product-images/?product=${productId}&ordering=id`, { credentials: "include" });
    if (res.ok) {
      const d = await res.json();
      const rows = Array.isArray(d) ? d : (Array.isArray(d?.results) ? d.results : []);
      return rows?.[0]?.image_url || rows?.[0]?.image || null;
    }
  } catch {}
  return null;
};

/** Robust items loader – works across your variants */
const fetchOrderItems = async (orderId) => {
  // A) nested
  let r = await safeGet(`/api/orders/${orderId}/items/`);
  if (r.ok) {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.results)) return r.data.results;
  }
  // B) flat
  r = await safeGet(`/api/order-items/?order=${encodeURIComponent(orderId)}&page_size=200`);
  if (r.ok) {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.results)) return r.data.results;
  }
  // C) alternate path
  r = await safeGet(`/api/orders/${orderId}/lines/`);
  if (r.ok) {
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.data?.results)) return r.data.results;
  }
  // D) if detail includes items
  r = await safeGet(`/api/orders/${orderId}/`);
  if (r.ok && Array.isArray(r.data?.items)) return r.data.items;

  return [];
};

export default function OrdersHub() {
  const nav = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const prefillId = params.get("order") || params.get("q") || ""; // allows /orders?order=24

  const [query, setQuery] = useState(prefillId);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const [activeId, setActiveId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sumLoading, setSumLoading] = useState(false);

  const [imageMap, setImageMap] = useState({});
  const inFlight = useRef(new Set());

  /* ===== Data loaders ===== */

  const loadRecent = async () => {
    setErr(""); setLoading(true);
    try {
      let r = await safeGet(`/api/orders/recent/`);
      if (r.ok && Array.isArray(r.data)) {
        setResults(r.data);
      } else {
        r = await safeGet(`/api/orders/?limit=5&ordering=-created`);
        const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.results) ? r.data.results : []);
        setResults(list || []);
      }
    } catch (e) {
      setErr(e.message || "Failed to load recent orders");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /** Open a specific order and populate both panes */
  const openOrderById = async (id, { updateList = true } = {}) => {
    const r = await safeGet(`/api/orders/${id}/`);
    if (!r.ok || !r.data) throw new Error(r?.data?.detail || "Order not found");
    if (updateList) setResults([r.data]);     // show exact order on the left
    await loadSummary(r.data.id ?? id);
    setQuery(String(id));
  };

  const search = async (forcedId) => {
    const q = (forcedId ?? query ?? "").trim();
    if (!q) { await loadRecent(); return; }

    setErr(""); setLoading(true);
    try {
      // If it looks like an id, try direct
      if (/^[A-Za-z0-9-]+$/.test(q)) {
        await openOrderById(q, { updateList: true });
        setLoading(false);
        return;
      }
      // Otherwise query the list endpoint with search
      const r = await safeGet(`/api/orders/?search=${encodeURIComponent(q)}&ordering=-created`);
      const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.results) ? r.data.results : []);
      setResults(list || []);
      if (!list?.length) setErr("No orders found.");
    } catch (e) {
      setErr(e.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (oid) => {
    if (!oid) return;
    setSumLoading(true); setErr(""); setActiveId(String(oid)); setSummary(null);
    try {
      const r = await safeGet(`/api/orders/${oid}/`);
      if (!r.ok || !r.data) throw new Error(r.data?.detail || "Failed to load order");

      const rawItems = await fetchOrderItems(oid);

      const items = (rawItems || []).map((it, i) => {
        const fallback = it.product_image || it.image_url || it.thumbnail || it._image || it.image || "";
        const price = toNum(it.price ?? it.unit_price);
        const qty = toNum(it.quantity) || 1;
        return {
          product_id: it.product_id ?? it.product ?? it.id ?? i,
          name: it.name || it.product_name || `Item ${i + 1}`,
          quantity: qty,
          price,
          line_total: toNum(it.line_total) || price * qty,
          _fallback: resolveUrl(fallback),
        };
      });

      const subtotal = toNum(r.data.subtotal) || items.reduce((a, i) => a + i.line_total, 0);
      const discount = toNum(r.data.discount);
      const total = toNum(r.data.total) || Math.max(0, subtotal - discount);

      setSummary({
        id: r.data.id ?? oid,
        paid: r.data.paid ?? null,
        created: r.data.created || r.data.created_at,
        first_name: r.data.first_name,
        last_name: r.data.last_name,
        email: r.data.email,
        address: r.data.address,
        postal_code: r.data.postal_code,
        city: r.data.city,
        items, subtotal, discount, total,
      });
    } catch (e) {
      setErr(e.message || "Failed to load order summary");
    } finally {
      setSumLoading(false);
    }
  };

  /* ===== Effects ===== */

  // Bootstrap: if ?order=ID, open it; else use session last_order_id; else show recents
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        let id = prefillId || null;
        if (!id) {
          id = await pickIdFromSession();
        }
        if (id) {
          await openOrderById(id, { updateList: true });
        } else {
          await loadRecent();
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message || "Failed to load initial orders");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefillId, location.search]);

  // Upgrade images in summary (cached)
  useEffect(() => {
    if (!summary?.items?.length) return;
    summary.items.forEach(async (it) => {
      const pid = it.product_id; if (!pid) return;
      if (imageMap[pid] !== undefined || inFlight.current.has(pid)) return;
      inFlight.current.add(pid);
      const url = await fetchBestImage(pid);
      setImageMap((m) => ({ ...m, [pid]: url || it._fallback }));
      inFlight.current.delete(pid);
    });
  }, [summary, imageMap]);

  const copy = async (text) => { try { await navigator.clipboard.writeText(String(text)); } catch {} };

  /* ===== UI ===== */
  return (
    <Box sx={{ minHeight: "100vh", background: PAGE_BG, color: TEXT_MAIN }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mb: { xs: 8 }, p: { xs: 2, md: 4 }, pb: 8 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, mb: 2, color: GOLD, fontFamily: "'Playfair Display', serif" }}
        >
          My orders
        </Typography>

        {/* Search header */}
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${FRAME_BORDER}`, bgcolor: FRAME_BG, backdropFilter: "blur(8px)", mb: 2 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
              <TextField
                size="small"
                placeholder="Search by order #, email, or name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                sx={{
                  minWidth: 260, flex: 1,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.06)", color: TEXT_MAIN,
                    "& fieldset": { borderColor: GOLD_BORDER },
                    "&:hover fieldset": { borderColor: GOLD },
                    "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(245,222,179,.25)" },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => search()}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  borderRadius: 999, px: 3, fontWeight: 900,
                  background: `linear-gradient(90deg, ${GOLD}, #caa46c, ${GOLD})`,
                  color: "#121212", boxShadow: "0 0 18px rgba(255,215,150,.25)",
                  "&:hover": { background: `linear-gradient(90deg, #caa46c, ${GOLD}, #caa46c)` },
                }}
              >
                View order
              </Button>
              <Button component={Link} to="/shop" variant="outlined"
                sx={{ borderRadius: 999, px: 2.5, color: GOLD, borderColor: GOLD_BORDER, "&:hover": { borderColor: GOLD } }}>
                Continue shopping
              </Button>
              <Tooltip title="Reload recent"><IconButton onClick={loadRecent}><ReplayIcon sx={{ color: GOLD }} /></IconButton></Tooltip>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} alignItems="flex-start">
          {/* LEFT: results */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${FRAME_BORDER}`, bgcolor: FRAME_BG, backdropFilter: "blur(8px)" }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {err && <Alert severity="error" sx={{ mb: 1.5 }}>{err}</Alert>}
                {loading ? (
                  <Stack spacing={1.25}>{Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={68} sx={{ bgcolor: "rgba(255,255,255,.08)", borderRadius: 2 }} />
                  ))}</Stack>
                ) : results.length === 0 ? (
                  <Typography sx={{ color: TEXT_MID }}>No orders found.</Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {results.map((o, i) => {
                      const oid = o.id ?? o.order_id ?? o.pk ?? o.uuid ?? `#${i + 1}`;
                      const created = o.created || o.created_at || "";
                      const paid = o.paid ?? null;
                      const subtotal = toNum(o.subtotal);
                      const discount = toNum(o.discount);
                      const total = toNum(o.total ?? Math.max(0, subtotal - discount));
                      const person = [o.first_name, o.last_name].filter(Boolean).join(" ");
                      return (
                        <Card key={`${oid}-${i}`} elevation={0}
                          sx={{ p: 1, borderRadius: 2, border: `1px solid ${FRAME_BORDER}`, bgcolor: "rgba(255,255,255,.04)" }}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Stack spacing={0.25}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: GOLD }}>Order #{oid}</Typography>
                              <Typography variant="caption" sx={{ color: TEXT_MID }}>{created || "—"} {person && `• ${person}`}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {paid != null && <Chip size="small" label={paid ? "Paid" : "Unpaid"} variant="outlined" sx={{ color: GOLD, borderColor: GOLD_BORDER }} />}
                              <Typography variant="body2" sx={{ fontWeight: 900, color: GOLD }}>{fmtMoney(total)}</Typography>
                              <Button size="small" variant="text" onClick={() => loadSummary(oid)} endIcon={<ArrowForwardIcon />} sx={{ color: GOLD }}>
                                View
                              </Button>
                              <IconButton size="small" onClick={() => copy(oid)}><ContentCopyIcon fontSize="small" sx={{ color: TEXT_MID }} /></IconButton>
                            </Stack>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT: summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={0}
              sx={{ borderRadius: 3, border: `1px solid ${FRAME_BORDER}`, bgcolor: FRAME_BG, backdropFilter: "blur(8px)", position: { md: "sticky" }, top: { md: 24 } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: GOLD }}>Order summary</Typography>
                  {activeId && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ color: TEXT_MID }}>#{activeId}</Typography>
                      <Button size="small" variant="outlined" component={Link} to={`/orders/${activeId}`}
                        sx={{ borderRadius: 999, px: 1.5, color: GOLD, borderColor: GOLD_BORDER, "&:hover": { borderColor: GOLD } }}>
                        Open page
                      </Button>
                    </Stack>
                  )}
                </Stack>

                {sumLoading ? (
                  <>
                    <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,.08)", mb: 1 }} />
                    <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,.08)", mb: 1 }} />
                    <Skeleton variant="rounded" height={32} sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,.08)", mt: 2 }} />
                  </>
                ) : !summary ? (
                  <Typography sx={{ color: TEXT_MID }}>Search and select an order to view its details.</Typography>
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ color: GOLD, mb: 1 }}>
                      {[summary.first_name, summary.last_name].filter(Boolean).join(" ") || 'Customer'}
                    </Typography>

                    {/* Items */}
                    {summary.items.length > 0 ? (
                      <Stack spacing={1.1}>
                        {summary.items.map((it, idx) => {
                          const img = imageMap[it.product_id] ?? it._fallback;
                          return (
                            <Card key={`${it.product_id || idx}-${idx}`} elevation={0}
                              sx={{ p: 1, borderRadius: 2, border: `1px solid ${FRAME_BORDER}`, bgcolor: "rgba(255,255,255,.04)" }}>
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <CardMedia component="img" image={img || "/media/placeholder.png"} alt={it.name}
                                  onError={(e) => { e.currentTarget.src = "/media/placeholder.png"; }}
                                  sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1.5, border: `1px solid ${GOLD_BORDER}` }} />
                                <Stack sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: GOLD }} noWrap title={it.name}>{it.name}</Typography>
                                  <Typography variant="caption" sx={{ color: TEXT_MID }}>Unit: {fmtMoney(it.price)} • Qty: {it.quantity}</Typography>
                                </Stack>
                                <Box sx={{ flex: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 900, color: GOLD }}>{fmtMoney(it.line_total)}</Typography>
                              </Stack>
                            </Card>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Card elevation={0} sx={{ borderRadius: 2, border: `1px dashed ${GOLD_BORDER}`, bgcolor: "rgba(255,255,255,.04)", mb: 1 }}>
                        <CardContent sx={{ py: 1.25 }}>
                          <Typography variant="body2" sx={{ color: TEXT_MID }}>
                            No line items were returned for this order.
                          </Typography>
                        </CardContent>
                      </Card>
                    )}

                    <Divider sx={{ my: 1.5, borderColor: GOLD_BORDER }} />
                    <Stack direction="row" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>{fmtMoney(summary.subtotal)}</Typography></Stack>
                    {summary.discount > 0 && (
                      <Stack direction="row" justifyContent="space-between"><Typography sx={{ color: TEXT_MID }}>Discount</Typography><Typography sx={{ color: TEXT_MID }}>- {fmtMoney(summary.discount)}</Typography></Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography sx={{ fontWeight: 900, color: GOLD }}>Total</Typography>
                      <Typography sx={{ fontWeight: 900, color: GOLD }}>{fmtMoney(summary.total)}</Typography>
                    </Stack>
                    {summary.paid != null && (
                      <Chip size="small" label={summary.paid ? "Paid" : "Unpaid"} variant="outlined" sx={{ mt: 1.25, alignSelf: "flex-start", color: GOLD, borderColor: GOLD_BORDER }} />
                    )}

                    <Divider sx={{ my: 1.5, borderColor: GOLD_BORDER }} />
                    <Typography variant="caption" sx={{ color: TEXT_MID }}>
                      Ship to: {[summary.address, `${summary.city || ''} ${summary.postal_code || ''}`].filter(Boolean).join(', ')} • {summary.email}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
