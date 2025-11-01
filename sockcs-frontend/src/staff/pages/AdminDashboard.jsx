import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box, Card, CardContent, Grid, Typography, Divider, Chip, LinearProgress, Link as MLink
} from "@mui/material";
import {
  ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";

const GOLD   = "#f5deb3";
const CARD_BG = "rgba(255,255,255,.06)";
const BORDER = "rgba(255,255,255,.10)";
const TEXT   = "rgba(255,255,255,.96)";
const DIM    = "rgba(255,255,255,.72)";

// small fetch helper that adds Bearer automatically
async function apiGet(path, access) {
  const res = await fetch(path, {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
    credentials: "include",
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

export default function AdminDashboard() {
  const { tokens } = useAuth();
  const access = tokens?.access || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);        // [{day, revenue, orders}]
  const [recent, setRecent] = useState([]);        // last 5–10 orders
  const [top, setTop] = useState([]);              // top products last 30d
  const [lowStock, setLowStock] = useState([]);    // low inventory
  const [enquiries, setEnquiries] = useState({open:0, pending:0, resolved:0});

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true); setErr("");

        const [a, b, c, d, e] = await Promise.allSettled([
          apiGet("/api/admin/stats/", access),                        // {revenue_today, orders_today, aov_7d, conv_rate_7d, customers_today,…}
          apiGet("/api/admin/sales_30d/", access),                    // [{day:'2025-10-20', revenue:123.45, orders:7}, ...]
          apiGet("/api/admin/recent_orders/?limit=8", access),        // [{id, first_name, last_name, paid, created}, ...]
          apiGet("/api/admin/top_products/?days=30&limit=5", access), // [{name, units, revenue}, ...]
          apiGet("/api/admin/low_stock/?limit=8", access),            // [{id,name,stock,sku}, ...]
        ]);

        const enqu = await apiGet("/api/admin/enquiries/summary/", access).catch(()=>null); // {open: X, pending: Y, resolved: Z}

        if (!live) return;
        setStats(a.status === "fulfilled" ? a.value : null);
        setSeries(b.status === "fulfilled" ? (b.value || []) : []);
        setRecent(c.status === "fulfilled" ? (c.value || []) : []);
        setTop(d.status === "fulfilled" ? (d.value || []) : []);
        setLowStock(e.status === "fulfilled" ? (e.value || []) : []);
        if (enqu) setEnquiries(enqu);
      } catch (e) {
        if (live) setErr("Failed to load dashboard data.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [access]);

  const kpis = useMemo(() => ([
    { label: "Revenue Today",  value: money(stats?.revenue_today), hint: "vs. 7-day avg", delta: pctDelta(stats?.revenue_today, stats?.revenue_avg_7d) },
    { label: "Orders Today",   value: stats?.orders_today ?? "—",   hint: "vs. 7-day avg", delta: pctDelta(stats?.orders_today, stats?.orders_avg_7d) },
    { label: "Avg Order Value",value: money(stats?.aov_7d),         hint: "7-day avg",     delta: null },
    { label: "Conversion",     value: stats?.conv_rate_7d != null ? `${(stats.conv_rate_7d*100).toFixed(1)}%` : "—", hint: "last 7d", delta: null },
    { label: "New Customers",  value: stats?.customers_today ?? "—",hint: "today",         delta: null },
    { label: "Open Enquiries", value: enquiries?.open ?? "—",       hint: "now",           delta: null },
  ]), [stats, enquiries]);

  return (
    <Grid container spacing={2}>
      {/* KPIs */}
      {kpis.map((k, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
            <CardContent>
              <Typography sx={{ color: DIM, mb: .5 }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ color: GOLD, fontWeight: 900 }}>
                {loading ? "…" : k.value}
              </Typography>
              <Box sx={{ mt: .75, display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: DIM }}>{k.hint}</Typography>
                {k.delta != null && (
                  <Chip size="small"
                        label={`${k.delta>0?"+":""}${k.delta.toFixed(1)}%`}
                        sx={{ height: 20, color: k.delta>=0 ? "#0ecb81" : "#e23f3f", borderColor: BORDER }}
                        variant="outlined" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Revenue vs Orders chart */}
      <Grid item xs={12} md={8}>
        <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ color: TEXT, fontWeight: 700, mb: 1 }}>Revenue vs Orders (last 30 days)</Typography>
            <Divider sx={{ borderColor: BORDER, mb: 2 }} />
            {loading ? <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} /> : (
              <Box sx={{ height: 280 }}>
                {(!series || series.length === 0) ? (
                  <Typography sx={{ color: DIM }}>No sales yet.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series.map(d => ({...d, day: new Date(d.day).toLocaleDateString()}))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar   yAxisId="left"  dataKey="orders"  name="Orders" />
                      <Area  yAxisId="right" dataKey="revenue" name="Revenue" type="monotone" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Top products */}
      <Grid item xs={12} md={4}>
        <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ color: TEXT, fontWeight: 700, mb: 1 }}>Top Products (30d)</Typography>
            <Divider sx={{ borderColor: BORDER, mb: 1.5 }} />
            {!loading && top.length === 0 && <Typography sx={{ color: DIM }}>No data</Typography>}
            {loading ? <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} /> : (
              <Box sx={{ display:"grid", gap: 1 }}>
                {top.map((p, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <Box sx={{ color: TEXT, pr: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </Box>
                    <Box sx={{ color: DIM }}>{p.units} • {money(p.revenue)}</Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent orders */}
      <Grid item xs={12} md={8}>
        <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ color: TEXT, fontWeight: 700, mb: 1 }}>Recent Orders</Typography>
            <Divider sx={{ borderColor: BORDER, mb: 1 }} />
            {loading ? <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} /> : (
              <Box component="table" sx={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead style={{ color: DIM }}>
                  <tr>
                    <th style={{ textAlign:"left", padding:"6px 8px" }}>ID</th>
                    <th style={{ textAlign:"left", padding:"6px 8px" }}>Customer</th>
                    <th style={{ textAlign:"left", padding:"6px 8px" }}>Paid</th>
                    <th style={{ textAlign:"left", padding:"6px 8px" }}>Date</th>
                    <th style={{ textAlign:"left", padding:"6px 8px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(recent || []).map((o) => (
                    <tr key={o.id} style={{ borderTop:`1px solid ${BORDER}` }}>
                      <td style={{ padding:"6px 8px", color:TEXT }}>#{o.id}</td>
                      <td style={{ padding:"6px 8px", color:TEXT }}>{o.first_name} {o.last_name}</td>
                      <td style={{ padding:"6px 8px", color:DIM }}>{o.paid ? "Yes" : "No"}</td>
                      <td style={{ padding:"6px 8px", color:DIM }}>{new Date(o.created).toLocaleString()}</td>
                      <td style={{ padding:"6px 8px" }}>
                        <MLink href={`/staff/orders/${o.id}`} underline="none" sx={{ color: GOLD }}>Open</MLink>
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr><td colSpan={5} style={{ padding:"12px 8px", color:DIM }}>No recent orders.</td></tr>
                  )}
                </tbody>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Low stock */}
      <Grid item xs={12} md={4}>
        <Card elevation={0} sx={{ bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ color: TEXT, fontWeight: 700, mb: 1 }}>Low Stock</Typography>
            <Divider sx={{ borderColor: BORDER, mb: 1.5 }} />
            {loading ? <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} /> : (
              <Box sx={{ display:"grid", gap: 1 }}>
                {lowStock.length === 0 ? (
                  <Typography sx={{ color: DIM }}>All good for now.</Typography>
                ) : lowStock.map((p) => (
                  <Box key={p.id} sx={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                    <Box sx={{ color:TEXT, pr: 2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.name} {p.sku ? <span style={{ color:DIM }}>· {p.sku}</span> : null}
                    </Box>
                    <Chip size="small" label={`Stock: ${p.stock}`} sx={{ borderColor:BORDER }} variant="outlined" />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function pctDelta(now, avg) {
  if (now == null || avg == null || Number(avg) === 0) return null;
  return ((Number(now) - Number(avg)) / Number(avg)) * 100;
}
