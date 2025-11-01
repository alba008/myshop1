// src/pages/admin/AdminOrderDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box, Card, CardContent, Typography, Divider, Chip, Stack, Button, LinearProgress, Avatar
} from "@mui/material";

const GOLD    = "#f5deb3";
const CARD_BG = "rgba(255,255,255,.06)";
const BORDER  = "rgba(255,255,255,.10)";
const TEXT    = "rgba(255,255,255,.96)";
const DIM     = "rgba(255,255,255,.72)";

async function apiGet(path, access) {
  const res = await fetch(path, {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

async function apiPost(path, access, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

function money(n) {
  if (n == null) return "—";
  try { return new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(Number(n)); }
  catch { return String(n); }
}

/* ---------------- Shipping normalization ---------------- */
function firstNonEmpty(obj, keys) {
  for (const k of keys) {
    const v = obj && obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function normalizeShipping(order) {
  // Prefer nested shipping block if present
  const sRaw = order?.shipping || {};

  // Handle common nested containers
  const nestedAddr =
    sRaw.address ||
    sRaw.shipping_address ||
    (sRaw.addresses && (sRaw.addresses.shipping || sRaw.addresses.default)) ||
    order?.shipping_address ||
    order?.address || // sometimes order.address is an object!
    null;

  // Merge nested object (if any) onto the raw shipping
  const s = typeof nestedAddr === "object" && nestedAddr !== null ? { ...sRaw, ...nestedAddr } : { ...sRaw };

  // Helper to search shipping first, then order top-level aliases
  const pick = (shippingKeys, orderKeys = []) =>
    firstNonEmpty(s, shippingKeys) ?? firstNonEmpty(order || {}, orderKeys) ?? null;

  const first_name = pick(["first_name","given_name","contact_first_name"], ["shipping_first_name","ship_first_name","first_name"]);
  const last_name  = pick(["last_name","family_name","contact_last_name"], ["shipping_last_name","ship_last_name","last_name"]);
  const company    = pick(["company","organization"], ["shipping_company","ship_company","company"]);

  // Address line 1 (include ultra-generic aliases)
  let address1 = pick(
    ["address1","line1","street1","street","address_line1","address_line_1","street_address1","street_address_1","addr1","addr_line1"],
    ["shipping_address1","ship_address1","address","address_line1","addr1"]
  );
  // If top-level order.address is a single string with commas, split to derive address1/city/state/postal
  if (!address1 && typeof order?.address === "string" && order.address.trim()) {
    address1 = order.address.trim();
  }

  const address2 = pick(
    ["address2","line2","street2","address_line2","address_line_2","street_address2","street_address_2","addr2","addr_line2"],
    ["shipping_address2","ship_address2","address2","addr2"]
  );

  let city   = pick(["city","locality","town","town_city","city_name"], ["shipping_city","ship_city","city"]);
  let state  = pick(["state","region","province","state_code","region_code","province_code","county"], ["shipping_state","ship_state","state"]);
  let postal = pick(["postal_code","postcode","zip","zip_code"], ["shipping_postal_code","shipping_zip","ship_postal_code","ship_zip","postal_code"]);
  let country= pick(["country","country_code","country_iso","country_iso2","country_name"], ["shipping_country","ship_country","country"]);
  const phone= pick(["phone","telephone","mobile","phone_number","mobile_phone"], ["shipping_phone","ship_phone","phone"]);
  const email= pick(["email","contact_email","email_address"], ["shipping_email","ship_email","email"]);

  // If order.address was a single string, try to infer city/state/postal if they are empty
  if (!city && !state && !postal && typeof order?.address === "string" && order.address.includes(",")) {
    const tail = [order.city, order.state, order.postal_code].filter(Boolean).join(" ");
    if (tail) {
      city = order.city ?? city;
      state = order.state ?? state;
      postal = order.postal_code ?? postal;
    }
  }

  // Always compute our own display (ignore API's display so we don't mask missing lines)
  const display =
    [
      [first_name, last_name].filter(Boolean).join(" ") || null,
      company,
      address1,
      address2,
      [city, state].filter(Boolean).join(", ") || null,
      postal,
      country
    ].filter(Boolean).join(" · ") || null;

  const payload = {
    first_name, last_name, company, address1, address2,
    city, state, postal_code: postal, country, phone, email, display
  };

  // If we truly have nothing, return null
  return Object.values(payload).some(v => v && String(v).trim() !== "") ? payload : null;
}

/* ---------------- Shipping block (always shows fields, not just display) ---------------- */
function ShippingBlock({ shipping, fallbackOrder }) {
  const hasAny = !!shipping;
  const {
    first_name, last_name, company, address1, address2,
    city, state, postal_code, country, phone, email, display
  } = shipping || {};

  // Final fallbacks for truly minimal schemas
  const fallbackLine =
    !hasAny &&
    [fallbackOrder?.address, [fallbackOrder?.city, fallbackOrder?.state].filter(Boolean).join(", "), fallbackOrder?.postal_code]
      .filter(Boolean)
      .join(" · ");

  if (!hasAny && !fallbackLine) return null;

  const name = [first_name || fallbackOrder?.first_name, last_name || fallbackOrder?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ color: DIM, mb: .5 }}>Ship to</Typography>

      {/* Show our composed single-line for quick read */}
      {(display || fallbackLine) && (
        <Typography sx={{ color: TEXT, mb: 0.5 }}>
          {display || fallbackLine}
        </Typography>
      )}

      {/* Also render granular lines so street/city always appear when present */}
      <Stack spacing={0.25}>
        {name && <Typography sx={{ color: TEXT }}>{name}</Typography>}
        {company && <Typography sx={{ color: DIM }}>{company}</Typography>}
        {address1 && <Typography sx={{ color: DIM }}>{address1}</Typography>}
        {address2 && <Typography sx={{ color: DIM }}>{address2}</Typography>}
        {(city || state || postal_code) && (
          <Typography sx={{ color: DIM }}>
            {[city, state].filter(Boolean).join(", ")} {postal_code || ""}
          </Typography>
        )}
        {country && <Typography sx={{ color: DIM }}>{country}</Typography>}
        {phone && <Typography sx={{ color: DIM }}>📞 {phone}</Typography>}
        {email && <Typography sx={{ color: DIM }}>✉️ {email}</Typography>}
      </Stack>
    </Box>
  );
}

/* ---------------- Page ---------------- */
export default function AdminOrderDetail() {
  const { tokens } = useAuth();
  const access = tokens?.access || null;
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiGet(`/api/admin/orders/${id}/`, access);
      setOrder(data || null);
    } catch (e) {
      setErr("Failed to load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, access]);

  async function onMarkPaid() {
    try {
      await apiPost(`/api/admin/orders/${id}/mark_paid/`, access);
      await load();
    } catch {
      setErr("Failed to mark as paid.");
    }
  }

  if (loading) return <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} />;
  if (!order) return <Typography sx={{ color: DIM }}>Not found.</Typography>;

  const itemCount = (order.items || []).reduce((acc, it) => acc + Number(it?.quantity || 0), 0);
  const shippingNorm = normalizeShipping(order);

  return (
    <Stack spacing={2}>
      {!!err && (
        <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ color: GOLD }}>{err}</Typography>
          </CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Typography variant="h6" sx={{ color: GOLD, fontWeight: 900 }}>Order #{order.id}</Typography>
              <Chip size="small" label={order.paid ? "paid" : "unpaid"} variant="outlined"
                    sx={{ color: order.paid ? "#0ecb81" : GOLD, borderColor: BORDER }} />
            </Stack>
            <Stack direction="row" spacing={1}>
              {order.invoice_url && (
                <Button
                  component="a"
                  href={order.invoice_url}
                  target="_blank" rel="noopener"
                  variant="outlined"
                  sx={{ color: GOLD, borderColor: GOLD, "&:hover": { borderColor: GOLD } }}
                >
                  Invoice PDF
                </Button>
              )}
              {!order.paid && (
                <Button onClick={onMarkPaid} variant="contained"
                        sx={{ bgcolor: "#0ecb81", color: "#121212", "&:hover": { bgcolor: "#0ecb81" } }}>
                  Mark paid
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: BORDER, my: 1.25 }} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {/* Customer */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: DIM, mb: .5 }}>Customer</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(245,222,179,.12)", color: GOLD }}>
                  {(order.first_name?.[0] || "?").toUpperCase()}
                </Avatar>
                <Stack>
                  <Typography sx={{ color: TEXT, fontWeight: 700 }}>
                    {[order.first_name, order.last_name].filter(Boolean).join(" ") || "—"}
                  </Typography>
                  <Typography sx={{ color: DIM }}>{order.email || "—"}</Typography>
                </Stack>
              </Stack>

              {/* Shipping (normalized with robust fallbacks) */}
              <ShippingBlock shipping={shippingNorm} fallbackOrder={order} />
            </Box>

            {/* Meta / Totals */}
            <Box>
              <Typography sx={{ color: DIM, mb: .5 }}>Meta</Typography>
              <Typography sx={{ color: DIM }}>
                Created: <span style={{ color: TEXT }}>{new Date(order.created).toLocaleString()}</span>
              </Typography>
              {order.updated && (
                <Typography sx={{ color: DIM }}>
                  Updated: <span style={{ color: TEXT }}>{new Date(order.updated).toLocaleString()}</span>
                </Typography>
              )}
              <Typography sx={{ color: DIM }}>
                Items: <span style={{ color: TEXT }}>{itemCount}</span>
              </Typography>
              <Typography sx={{ color: DIM }}>
                Subtotal: <span style={{ color: TEXT }}>{money(order.subtotal)}</span>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ITEMS */}
      <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
        <CardContent>
          <Typography sx={{ color: TEXT, fontWeight: 700, mb: 1 }}>Items</Typography>
          <Divider sx={{ borderColor: BORDER, mb: 1 }} />
          <Box component="table" sx={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead style={{ color: DIM }}>
              <tr>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Product</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Price</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Qty</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, i) => (
                <tr key={i} style={{ borderTop:`1px solid ${BORDER}` }}>
                  <td style={{ padding:"6px 8px", color:TEXT }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      {it.product_image ? (
                        <Avatar variant="rounded" src={it.product_image} sx={{ width: 28, height: 28 }} />
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 28, height: 28, bgcolor: "rgba(255,255,255,.08)" }}>🛒</Avatar>
                      )}
                      <Stack>
                        <Typography variant="body2" sx={{ color: TEXT, lineHeight: 1.2 }}>
                          {it.product_name || `#${it.product_id ?? it.id}`}
                        </Typography>
                        {it.product_id != null && (
                          <Typography variant="caption" sx={{ color: DIM, lineHeight: 1.2 }}>
                            ID: {it.product_id}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </td>
                  <td style={{ padding:"6px 8px", color:DIM }}>{money(it.price)}</td>
                  <td style={{ padding:"6px 8px", color:DIM }}>{it.quantity}</td>
                  <td style={{ padding:"6px 8px", color:TEXT }}>
                    {money(it.line_total ?? Number(it.price || 0) * Number(it.quantity || 0))}
                  </td>
                </tr>
              ))}
              {(!order.items || order.items.length === 0) && (
                <tr><td colSpan={4} style={{ padding:"12px 8px", color:DIM }}>No items.</td></tr>
              )}
            </tbody>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
