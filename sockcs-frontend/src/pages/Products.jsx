// src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/http";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import { SlidersHorizontal, Grid3x3, List, Search } from "lucide-react";
import Banner from "../components/Banner";
import { Link } from "react-router-dom";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// host/port helper
import { sameOrigin } from "../lib/config";


/* -------- helpers (keep dimensions; fix image URLs) -------- */
const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try {
    return sameOrigin(new URL(u).toString());
  } catch {
    const s = String(u).trim();
    if (s.startsWith("/media/")) return sameOrigin(s);
    if (/^(products|marketing|gallery)\//i.test(s)) return sameOrigin(`/media/${s}`);
    if (/^[\w\-]+\.(jpe?g|png|gif|webp)$/i.test(s)) return sameOrigin(`/media/${s}`);
    return s;
  }
};

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const getCategory = (p) =>
  (typeof p.category === "object" ? p?.category?.name : p?.category_name) || "";

/* -------- page -------- */
export default function Products() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/products/", { credentials: "include" });
        const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const norm = rows.map((p) => ({
          ...p,
          _image: resolveUrl(p.image || p.image_url || p.thumbnail || p.file),
        }));
        setItems(norm);
      } catch (e) {
        setErr(e.message || "Failed to load products");
      }
    })();
  }, []);

  const categories = useMemo(() => {
    if (!items) return ["All"];
    const set = new Set(items.map(getCategory).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let rows = [...items];

    if (category !== "All") rows = rows.filter((p) => getCategory(p) === category);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter((p) =>
        [p.name, p.description, getCategory(p), p.brand]
          .map((x) => (x || "").toString().toLowerCase())
          .join(" ")
          .includes(needle)
      );
    }

    switch (sort) {
      case "price-asc":
        rows.sort((a, b) => Number(a.price ?? a.unit_price ?? 0) - Number(b.price ?? b.unit_price ?? 0));
        break;
      case "price-desc":
        rows.sort((a, b) => Number(b.price ?? b.unit_price ?? 0) - Number(a.price ?? a.unit_price ?? 0));
        break;
      case "name":
        rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      default:
        rows.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    }
    return rows;
  }, [items, q, category, sort]);

  // Anchor for AI recs — prefer first of filtered (respects search/category), fallback to first item
  const featuredProductId = useMemo(() => {
    if (filtered.length) return filtered[0].id;
    if (items?.length) return items[0].id;
    return null;
  }, [filtered, items]);

  if (err) return <Typography color="error" sx={{ p: 3 }}>{err}</Typography>;

  return (
    <Box
      sx={{
        pb: 16,
        my: "0px",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(245,222,179,0.07) 0%, rgba(14,15,18,1) 50%), linear-gradient(180deg, #0e0f12 0%, #0b0c0f 70%)",
        color: "rgba(255,255,255,.95)",
      }}
    >
      <Banner />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: 2, mb: 1.5 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800,
            letterSpacing: 0.2,
            color: "#f5deb3",
            fontSize: { xs: 20, md: 25 },
            textShadow: "0 0 18px rgba(245,222,179,0.18)",
          }}
        >
          Our Collection
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            color: "rgba(255,255,255,0.72)",
            fontSize: { xs: 14, md: 20 },
          }}
        >
          Hand-poured scents crafted for calm, warmth, and glow.
        </Typography>
      </Box>

      <AppBar
        position="static"
        elevation={0}
        sx={{
          mb: 3,
          background: "rgba(25,25,30,0.85)",
          backdropFilter: "blur(10px)",
          border: "0.1px solid rgba(245,222,179,0.8)",
          boxShadow: "0 0 25px rgba(245,222,179,0.30)",
          borderRadius: 3,
          mx: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          width: "auto",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, sm: 3 },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
            py: 1.25,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              flexGrow: 1,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              color: "#f5deb3",
              fontSize: { xs: 20, md: 25 },
              letterSpacing: 0.3,
            }}
          >
            Candles
          </Typography>

          <TextField
            size="small"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#f5deb3" />
                </InputAdornment>
              ),
              sx: { color: "white" },
            }}
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": {
                background: "rgba(255,255,255,0.06)",
                "& fieldset": { borderColor: "rgba(245,222,179,0.25)" },
                "&:hover fieldset": { borderColor: "rgba(245,222,179,0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#f5deb3", boxShadow: "0 0 12px rgba(245,222,179,0.25)" },
              },
            }}
          />

          <Select
            size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            sx={{
              color: "#f5deb3",
              minWidth: 140,
              background: "rgba(255,255,255,0.2)",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(245,222,179,0.25)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(245,222,179,0.5)" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f5deb3" },
            }}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="price-asc">Price ↑</MenuItem>
            <MenuItem value="price-desc">Price ↓</MenuItem>
            <MenuItem value="name">Name A–Z</MenuItem>
          </Select>

          <ToggleButtonGroup
            size="small"
            value={view}
            exclusive
            onChange={(e, v) => v && setView(v)}
            sx={{
              "& .MuiToggleButton-root": {
                color: "#f5deb3",
                backgroundColor: "rgba(245,222,179,0.10)",
                borderColor: "rgba(245,222,179,0.35)",
              },
              "& .Mui-selected": {
                backgroundColor: "rgba(245,222,179,0.20)",
                borderColor: "#f5deb3",
                color: "white",
              },
            }}
          >
            <ToggleButton value="grid" aria-label="grid view">
              <Grid3x3 size={16} />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <List size={16} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>

      {/* Categories */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1, px: { xs: 2, sm: 3, md: 4 } }}>
        <Chip
          icon={<SlidersHorizontal size={14} />}
          label="Categories"
          variant="outlined"
          sx={{
            color: "white",
            borderColor: "rgba(245,222,179,0.45)",
            "& .MuiChip-icon": { color: "#f5deb3" },
            background: "rgba(245,222,179,0.08)",
          }}
        />
        {categories.map((c) => (
          <Chip
            key={c}
            label={c}
            variant="outlined"
            onClick={() => setCategory(c)}
            clickable
            sx={{
              color: "white",
              borderColor: category === c ? "rgba(245,222,179,0.45)" : "rgba(245,222,179,0.35)",
              background: category === c ? "rgba(245,222,179,0.22)" : "transparent",
              "&:hover": {
                borderColor: "#f5deb3",
                background: "rgba(245,222,179,0.22)",
              },
            }}
          />
        ))}
      </Box>

     
      {/* ====== Products ====== */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {!items ? (
          <Typography sx={{ opacity: 0.8 }}>Loading...</Typography>
        ) : filtered.length === 0 ? (
          <EmptyState query={q} />
        ) : view === "grid" ? (
          <Grid container spacing={2}>
            {filtered.map((p) => (
              <Grid item key={p.id} xs={6} sm={6} md={4}>
                <Card
                  sx={{
                    borderRadius: 1,
                    height: "280px",
                    width: "170px",
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(12px) saturate(180%)",
                    WebkitBackdropFilter: "blur(12px) saturate(180%)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform .25s, box-shadow .25s, border-color .25s",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                      border: "1px solid rgba(245,222,179,0.6)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="150"
                    image={resolveUrl(p._image)}
                    alt={p.name}
                    onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                    sx={{
                      objectFit: "contain",
                      p: 1,
                      background: "linear-gradient(145deg, rgba(255,255,255,1), rgba(255,255,255,1))",
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />

                  <CardContent sx={{ flexGrow: 1, minHeight: 10, pb: 5 }}>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>
                      {p.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        width: "155px",
                        height: "25px",
                      }}
                    >
                      {p.description || "—"}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{ mt: 1, fontWeight: 800, color: "#90caf9", textShadow: "0 0 8px rgba(34,197,94,0.25)" }}
                    >
                      {fmtMoney(p.price ?? p.unit_price ?? 0)}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ position: "absolute", bottom: 12, right: 12 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        minWidth: 40,
                        height: 36,
                        borderRadius: "50%",
                        backdropFilter: "blur(6px)",
                        borderColor: "rgba(245,222,179,0.55)",
                        color: "#f5deb3",
                        "&:hover": {
                          backgroundColor: "rgba(245,222,179,0.15)",
                          borderColor: "#f5deb3",
                          color: "white",
                        },
                      }}
                      component={Link}
                      to={`/products/${p.id}/${(p.slug || p.name || "")
                        .toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")}`}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((p) => (
              <Grid item key={p.id} xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    height: "130px",
                    width: "350px",
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(12px) saturate(180%)",
                    WebkitBackdropFilter: "blur(12px) saturate(180%)",
                    transition: "transform .25s, box-shadow .25s, border-color .25s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={resolveUrl(p._image)}
                    alt={p.name}
                    onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: "contain",
                      flexShrink: 0,
                      p: 2,
                      background: "linear-gradient(145deg, rgba(255,255,255,1), rgba(255,255,255,1))",
                      borderRight: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />

                  <CardContent sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>
                      {p.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.description || "—"}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 800, color: "#9ecbff" }}>
                      {fmtMoney(p.price ?? p.unit_price ?? 0)}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ pr: 2 }}>
                    <Button
                      component={Link}
                      to={`/products/${p.id}/${(p.slug || p.name || "")
                        .toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        minWidth: 40,
                        height: 36,
                        borderRadius: "50%",
                        backdropFilter: "blur(6px)",
                        color: "#f5deb3",
                        "&:hover": {
                          backgroundColor: "rgba(245,222,179,0.15)",
                          color: "white",
                        },
                      }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      
    </Box>
  );
}

/* ------ small piece reused ------ */
function EmptyState({ query }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Typography
        variant="h5"
        sx={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 800,
          color: "#f5deb3",
          mb: 1,
        }}
      >
        No matches
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, color: "rgba(255,255,255,0.7)" }}>
        {query ? (
          <>Nothing matched “<b>{query}</b>”. Try a different search.</>
        ) : (
          <>No products are available yet.</>
        )}
      </Typography>

      <Button
        sx={{
          mt: 3,
          borderRadius: 999,
          px: 3,
          fontWeight: 800,
          background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
          color: "#121212",
          boxShadow: "0 0 18px rgba(255,215,150,.25)",
          "&:hover": {
            background: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
          },
        }}
        variant="contained"
        href="/"
      >
        Explore Featured
      </Button>
    </Box>
  );
}
