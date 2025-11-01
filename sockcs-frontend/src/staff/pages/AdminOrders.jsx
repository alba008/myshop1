import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box, Card, CardContent, Typography, Divider, TextField, ToggleButton, ToggleButtonGroup,
  LinearProgress, Chip, Stack, Button, Pagination, Link as MLink
} from "@mui/material";

const GOLD   = "#f5deb3";
const CARD_BG = "rgba(255,255,255,.06)";
const BORDER = "rgba(255,255,255,.10)";
const TEXT   = "rgba(255,255,255,.96)";
const DIM    = "rgba(255,255,255,.72)";

async function apiGet(path, access) {
  const res = await fetch(path, {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

export default function AdminOrders() {
  const { tokens } = useAuth();
  const access = tokens?.access || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | paid | unpaid

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr("");

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        if (status === "paid") params.set("paid", "true");
        if (status === "unpaid") params.set("paid", "false");
        if (q.trim()) params.set("search", q.trim()); // if your backend supports it

        const data = await apiGet(`/api/admin/orders/?${params.toString()}`, access);

        // DRF pagination: {count, next, previous, results}
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.results) ? data.results
          : Array.isArray(data?.items)   ? data.items
          : [];

        if (!alive) return;
        setRows(items);
        setCount(data?.count ?? items.length);
      } catch (e) {
        if (alive) setErr("Failed to load orders.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [access, page, status, q]);

  const pages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const header = useMemo(() => (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.25}
      alignItems={{ xs: "stretch", md: "center" }}
      justifyContent="space-between"
      sx={{ px: 2, py: 1.25, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: CARD_BG, mb: 2 }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 900, color: GOLD }}>Orders</Typography>
        <Chip size="small" label={`${count ?? 0} total`} sx={{ color: GOLD, borderColor: BORDER }} variant="outlined" />
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Search (name, email, id)…"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          sx={{ minWidth: 260 }}
          inputProps={{ style: { color: TEXT } }}
        />

        <ToggleButtonGroup
          exclusive
          value={status}
          onChange={(_, v) => v && (setPage(1), setStatus(v))}
          size="small"
          sx={{
            border: `1px solid ${BORDER}`,
            "& .MuiToggleButton-root": { color: TEXT, borderColor: BORDER },
            "& .Mui-selected": { background: "rgba(255,255,255,.08)", color: GOLD },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="paid">Paid</ToggleButton>
          <ToggleButton value="unpaid">Unpaid</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  ), [count, q, status]);

  return (
    <Box>
      {header}

      {err && (
        <Card elevation={0} sx={{ mb: 2, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: "rgba(255, 193, 7, .1)" }}>
          <CardContent><Typography sx={{ color: TEXT }}>{err}</Typography></CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: CARD_BG }}>
        <CardContent>
          {/* Header row */}
          <Stack direction="row" sx={{ color: DIM, px: 1 }}>
            <Box sx={{ width: 90 }}>#</Box>
            <Box sx={{ flex: 1 }}>Customer</Box>
            <Box sx={{ width: 280 }}>Email</Box>
            <Box sx={{ width: 120 }}>Paid</Box>
            <Box sx={{ width: 200 }}>Created</Box>
            <Box sx={{ width: 120, textAlign: "right" }}></Box>
          </Stack>
          <Divider sx={{ borderColor: BORDER, mb: 1 }} />

          {loading ? (
            <LinearProgress sx={{ bgcolor: "rgba(255,255,255,.08)" }} />
          ) : rows.length === 0 ? (
            <Typography sx={{ color: DIM, px: 1, py: 2 }}>No orders found.</Typography>
          ) : (
            rows.map((o) => (
              <Stack key={o.id} direction="row" alignItems="center"
                     sx={{ px: 1, py: .75, borderRadius: 1, "&:hover": { background: "rgba(255,255,255,.04)" } }}>
                <Box sx={{ width: 90, color: TEXT, fontWeight: 700 }}>#{o.id}</Box>
                <Box sx={{ flex: 1, color: TEXT }}>{o.first_name} {o.last_name}</Box>
                <Box sx={{ width: 280, color: DIM, overflow: "hidden", textOverflow: "ellipsis" }}>{o.email}</Box>
                <Box sx={{ width: 120 }}>
                  <Chip size="small" label={o.paid ? "paid" : "unpaid"} variant="outlined"
                        sx={{ color: o.paid ? "#0ecb81" : GOLD, borderColor: BORDER }} />
                </Box>
                <Box sx={{ width: 200, color: DIM }}>{new Date(o.created).toLocaleString()}</Box>
                <Box sx={{ width: 120, display: "flex", justifyContent: "flex-end" }}>
                  <MLink component={RouterLink} to={`/staff/orders/${o.id}`} underline="none" sx={{ color: GOLD }}>
                    Open
                  </MLink>
                </Box>
              </Stack>
            ))
          )}

          {/* Pagination */}
          {pages > 1 && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={(_, p) => setPage(p)}
                size="small"
                sx={{
                  "& .MuiPaginationItem-root": { color: TEXT },
                  "& .Mui-selected": { background: "rgba(255,255,255,.08)", color: GOLD },
                }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
