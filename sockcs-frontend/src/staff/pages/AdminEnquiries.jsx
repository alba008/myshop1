import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box, Card, CardContent, Typography, Stack, Chip, Skeleton, Divider,
  TextField, ToggleButton, ToggleButtonGroup, Alert, Button
} from "@mui/material";

const GOLD = "#f5deb3";
const BORDER = "rgba(255,255,255,.10)";
const CARD_BG = "rgba(255,255,255,.06)";
const TEXT = "rgba(255,255,255,.96)";
const DIM = "rgba(255,255,255,.72)";

// DRF defaults to trailing slash
const ENDPOINTS = [
  "/api/enquiries/?page_size=100",
];

const statusMap = (s) => {
  const v = (s || "").toString().toLowerCase();
  if (["done", "closed", "resolved"].includes(v)) return "resolved";
  if (["hold", "pending", "waiting"].includes(v)) return "pending";
  if (["new", "open", ""].includes(v)) return "open";
  return v || "open";
};

const fmtDate = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  return s.includes("T") ? s.replace("T", " ").replace("Z", "") : s;
};

function normalizeRecord(x, i) {
  const id = x.id ?? x.pk ?? i + 1;
  const subject = x.subject ?? x.title ?? x.topic ?? "(no subject)";
  const email = x.email ?? x.customer_email ?? x.user?.email ?? x.contact?.email ?? "unknown";
  const created = fmtDate(x.created_at ?? x.created ?? x.timestamp ?? x.date ?? "");
  const status = statusMap(x.status ?? x.state ?? x.stage);
  return { id, email, subject, created, status };
}

async function safeGet(url, accessToken) {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const res = await fetch(url, { credentials: "include", headers });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export default function AdminEnquiries() {
  const { tokens } = useAuth();
  const access = tokens?.access || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      let list = [];

      for (const ep of ENDPOINTS) {
        const r = await safeGet(ep, access);
        if (!alive) return;

        if (r.ok) {
          const arr = Array.isArray(r.data)
            ? r.data
            : Array.isArray(r.data?.results)
            ? r.data.results
            : Array.isArray(r.data?.items)
            ? r.data.items
            : [];
          list = arr.map(normalizeRecord);
          break;
        }
        if (r.status === 401 || r.status === 403) {
          setErr("You are not authorized to view enquiries (401/403). Log in as staff/superuser.");
          break;
        }
      }

      if (!alive) return;
      setRows(list);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [access]);

  // demo data (works even if API 403s)
  const demoRows = useMemo(() => ([
    { id: 4, email: "c@example.com",    subject: "Test",                      created: "2025-10-22 22:45:57", status: "open" },
    { id: 3, email: "ivy@example.com",  subject: "Discount code not applied", created: "2025-10-22 21:58:01", status: "resolved" },
    { id: 2, email: "mike@example.com", subject: "Size exchange",             created: "2025-10-22 21:58:01", status: "pending" },
    { id: 1, email: "nora@example.com", subject: "Shipping time",             created: "2025-10-22 21:58:01", status: "open" },
  ]), []);

  const data = demo ? demoRows : rows;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((e) => {
      const matchesQ = needle ? [e.email, e.subject, e.status].join(" ").toLowerCase().includes(needle) : true;
      const matchesS = filter === "all" ? true : e.status === filter;
      return matchesQ && matchesS;
    });
  }, [data, q, filter]);

  const counts = useMemo(() => {
    const all = data.length;
    return {
      all,
      open: data.filter(x => x.status === "open").length,
      pending: data.filter(x => x.status === "pending").length,
      resolved: data.filter(x => x.status === "resolved").length,
    };
  }, [data]);

  return (
    <Stack spacing={2}>
      {/* Controls */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ px: 2, py: 1.25, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: CARD_BG }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 900, color: GOLD }}>Enquiries</Typography>
          <Chip size="small" label={`${counts.all} total`} sx={{ color: GOLD, borderColor: BORDER }} variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Search enquiries…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 260 }}
            inputProps={{ style: { color: TEXT } }}
          />
          <ToggleButtonGroup
            exclusive
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
            size="small"
            sx={{
              border: `1px solid ${BORDER}`,
              "& .MuiToggleButton-root": { color: TEXT, borderColor: BORDER },
              "& .Mui-selected": { background: "rgba(255,255,255,.08)", color: GOLD },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="open">Open</ToggleButton>
            <ToggleButton value="pending">Pending</ToggleButton>
            <ToggleButton value="resolved">Resolved</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={demo ? "contained" : "outlined"}
            onClick={() => setDemo(d => !d)}
            sx={{
              color: demo ? "#121212" : GOLD,
              borderColor: GOLD,
              background: demo ? GOLD : "transparent",
              "&:hover": { borderColor: GOLD, background: demo ? GOLD : "rgba(255,255,255,.08)" },
            }}
          >
            Demo: {demo ? "ON" : "OFF"}
          </Button>
        </Stack>
      </Stack>

      {/* Error banner */}
      {err && (
        <Alert severity="warning" sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: "rgba(255, 193, 7, .1)", color: TEXT }}>
          {err}
        </Alert>
      )}

      {/* Table */}
      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: CARD_BG }}>
        <CardContent>
          <Stack spacing={1}>
            {/* Head */}
            <Stack direction="row" sx={{ color: DIM, px: 1 }}>
              <Box sx={{ width: 90 }}>#</Box>
              <Box sx={{ flex: 1 }}>Subject</Box>
              <Box sx={{ width: 260 }}>Email</Box>
              <Box sx={{ width: 180 }}>Created</Box>
              <Box sx={{ width: 120, textAlign: "right" }}>Status</Box>
            </Stack>
            <Divider sx={{ borderColor: BORDER }} />

            {/* Body */}
            {loading ? (
              <Stack spacing={1}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height={40} sx={{ bgcolor: "rgba(255,255,255,.08)", borderRadius: 1 }} />
                ))}
              </Stack>
            ) : filtered.length === 0 ? (
              <Stack alignItems="center" spacing={1.25} sx={{ py: 6 }}>
                <Typography sx={{ color: DIM }}>No enquiries found.</Typography>
                {!demo && (
                  <Button
                    onClick={() => setDemo(true)}
                    variant="outlined"
                    sx={{ color: GOLD, borderColor: GOLD, "&:hover": { borderColor: GOLD } }}
                  >
                    Load demo data
                  </Button>
                )}
              </Stack>
            ) : (
              filtered.map((e) => (
                <Stack
                  key={e.id}
                  direction="row"
                  alignItems="center"
                  sx={{ px: 1, py: 0.75, borderRadius: 1, "&:hover": { background: "rgba(255,255,255,.04)" } }}
                >
                  <Box sx={{ width: 90, color: TEXT, fontWeight: 700 }}>#{e.id}</Box>
                  <Box sx={{ flex: 1, color: TEXT }}>{e.subject}</Box>
                  <Box sx={{ width: 260, color: DIM }}>{e.email}</Box>
                  <Box sx={{ width: 180, color: DIM }}>{e.created || "—"}</Box>
                  <Box sx={{ width: 120, display: "flex", justifyContent: "flex-end" }}>
                    <Chip
                      size="small"
                      label={e.status}
                      sx={{
                        color: e.status === "resolved" ? "#0ecb81" : e.status === "pending" ? "#e2b714" : GOLD,
                        borderColor: BORDER
                      }}
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              ))
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
