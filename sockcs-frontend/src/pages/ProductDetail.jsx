// src/pages/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Button,
  IconButton,
  Breadcrumbs,
  Chip,
  Divider,
  Skeleton,
  TextField,
  Alert,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import RecommendedGrid from "../components/RecommendedGrid.jsx";
import { Sparkles } from "lucide-react";

import { API_BASE, sameOrigin } from "../lib/config";

const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  return sameOrigin(u);
};

const fmt = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [thumbs, setThumbs] = useState([]);
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;

    async function fetchJSON(url) {
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
      return r.json();
    }

    (async () => {
      setErr("");
      setLoading(true);
      try {
        // product
        const p = await fetchJSON(`${API_BASE}/api/products/${id}/`);
        const main = resolveUrl(p.image || p.image_url);

        // gallery
        let galleryUrls = [];
        try {
          const g = await fetchJSON(
            `${API_BASE}/api/product-images/?product=${encodeURIComponent(id)}&ordering=id`
          );
          const rows = Array.isArray(g) ? g : Array.isArray(g?.results) ? g.results : [];
          galleryUrls = rows
            .map((row) => resolveUrl(row.image || row.image_url || row.file || row.url || row.thumbnail))
            .filter(Boolean);
        } catch {
          /* optional endpoint */
        }

        const inline = Array.isArray(p.gallery || p.images)
          ? (p.gallery || p.images).map((x) => resolveUrl(x.image || x.image_url || x))
          : [];

        const all = [main, ...galleryUrls, ...inline]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        if (!alive) return;
        setProduct(p);
        const fallback = main || "/media/placeholder.png";
        setThumbs(all.length ? all : [fallback]);
        setActiveImg(all[0] || fallback);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load product");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const price = useMemo(() => Number(product?.price ?? 0), [product]);
  const bump = (d) => setQty((q) => Math.max(1, (Number(q) || 1) + d));

  const addToCart = async () => {
    try {
      setAdding(true);
      await addItem(product.id, qty);
      navigate("/cart");
    } catch (e) {
      setErr(e.message || "Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  // loading / error
  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Skeleton width={220} height={28} />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={480} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={480} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (err || !product) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4} }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button onClick={() => navigate(-1)} startIcon={<ArrowBackRoundedIcon />}>
            Back
          </Button>
        </Stack>
        <Alert severity="error">{err || "Product not found."}</Alert>
      </Box>
    );
  }

  // page
  return (
    <Box sx={{ bgcolor: "#0e0f12", color: "rgba(255,255,255,.95)", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
        {/* Breadcrumbs */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 14 }}>
            <RouterLink to="/shop" style={{ color: "white", textDecoration: "none" }}>
              Shop
            </RouterLink>
            <span style={{ color: "rgba(255,255,255,.6)" }}>{product.name}</span>
          </Breadcrumbs>
        </Stack>

        <Grid container spacing={3} alignItems="flex-start">
          {/* LEFT: Images */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.08)",
                bgcolor: "rgba(222,15,55,0.)",
                overflow: "hidden",
                mx: { xs: 2, md: 0 },
              }}
            >
              <CardMedia
                component="img"
                src={activeImg}
                alt={product.name}
                onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                sx={{
                  height: { xs: 360, md: 520 },
                  width: { xs:360, md:500},
                  bgcolor: "rgba(222,15,55,1)",
                  objectFit: "cover",
                  transition: "transform .35s ease",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              />
            </Card>

            {/* Thumbs */}
            <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: "auto" }}>
              {thumbs.slice(0, 12).map((src, i) => (
                <Box
                  key={`${src}-${i}`}
                  component="img"
                  src={src}
                  alt="thumb"
                  onClick={() => setActiveImg(src)}
                  onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 2,
                    cursor: "pointer",
                    border:
                      src === activeImg
                        ? "2px solid rgba(245,222,179,.8)"
                        : "1px solid rgba(255,255,255,.12)",
                  }}
                />
              ))}
            </Stack>
          </Grid>

          {/* RIGHT: Info / actions */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(255, 215, 140, 0.2)",
                background: "rgba(20, 20, 25, 0.85)",
                boxShadow: "0 0 25px rgba(255, 215, 150, 0.08)",
                backdropFilter: "blur(10px)",
                mx: { xs: 2, md: 0 },
                mb: { xs: 10, md: 0 },
                width: {xs:350, md: 400}
              }}
            >
              <CardContent sx={{ p: { xs: 3.5, md: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: 2, color: "rgba(245,222,179,.9)" }}>
                      Candle Studio
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        lineHeight: 1.15,
                        mb: 1,
                        fontFamily: "'Playfair Display', serif",
                        color: "#f5deb3",
                        textShadow: "0 0 15px rgba(255, 215, 150, 0.15)",
                      }}
                    >
                      {product.name}
                    </Typography>
                  </Box>
                  <IconButton aria-label="wishlist" sx={{ color: "rgba(255,255,255,.85)" }}>
                    <FavoriteBorderRoundedIcon />
                  </IconButton>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {product.brand && (
                    <Chip
                      size="small"
                      label={product.brand}
                      variant="outlined"
                      sx={{ color: "#f5deb3", borderColor: "rgba(245,222,179,.4)" }}
                    />
                  )}
                  <Chip
                    size="small"
                    icon={<LocalFireDepartmentRoundedIcon />}
                    label="Hand-poured"
                    variant="outlined"
                    sx={{ color: "#f5deb3", borderColor: "rgba(245,222,179,.4)" }}
                  />
                </Stack>

                <Typography variant="h5" sx={{ fontWeight: 900, mt: 1, color: "#f5deb3" }}>
                  {fmt(price)}
                </Typography>

                <Typography sx={{ opacity: 0.9, mt: 1.5, color: "rgba(255,255,255,.92)" }}>
                  {product.description ||
                    "A beautifully crafted candle designed to warm your space with cozy, luxurious scent notes."}
                </Typography>

                <Divider sx={{ my: 2.5, borderColor: "rgba(245,222,179,.35)" }} />

                {/* Quantity + Add to cart */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => bump(-1)} aria-label="decrease" sx={{ color: "#f5deb3" }}>
                      <RemoveRoundedIcon />
                    </IconButton>
                    <TextField
                      value={qty}
                      size="small"
                      inputProps={{ style: { textAlign: "center", width: 44 }, readOnly: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "rgba(245,222,179,.3)" },
                          "&:hover fieldset": { borderColor: "rgba(245,222,179,.5)" },
                        },
                        input: { color: "#f5deb3" },
                      }}
                    />
                    <IconButton onClick={() => bump(1)} aria-label="increase" sx={{ color: "#f5deb3" }}>
                      <AddRoundedIcon />
                    </IconButton>
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={addToCart}
                    disabled={adding}
                    sx={{
                      flex: 1,
                      borderRadius: 999,
                      py: 1.25,
                      fontWeight: 800,
                      background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                      color: "#121212",
                      boxShadow: "0 0 18px rgba(255,215,150,.25)",
                      "&:hover": {
                        background: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
                      },
                    }}
                  >
                    {adding ? "Adding…" : "Add to Cart"}
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                  <Button
                    variant="text"
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowBackRoundedIcon />}
                    sx={{ color: "#f5deb3" }}
                  >
                    Back
                  </Button>
                  <Button component={RouterLink} to="/shop" variant="text" sx={{ color: "#f5deb3" }}>
                    Continue shopping
                  </Button>
                </Stack>

                {product.care_instructions && (
                  <>
                    <Divider sx={{ my: 2.5, borderColor: "rgba(245,222,179,.35)" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: "#f5deb3" }}>
                      Care & burn tips
                    </Typography>
                    <Typography sx={{ opacity: 0.9, color: "rgba(255,255,255,.92)" }}>
                      {product.care_instructions}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* === AI recommendations — anchored to this product === */}
        {Boolean(id) && (
          
          <Box sx={{ mt: 0 }}>
                  <Sparkles size={18} color="#f5deb3" />

            <Typography
              variant="h6"
              sx={{
                mb: 1.5,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 800,
                color: "#f5deb3",
                textShadow: "0 0 12px rgba(245,222,179,0.18)",
              }}
              
            >

              You might also like
            </Typography>

            <RecommendedGrid
              productId={id}
              first={2}
              title="You might also like"
            />
          </Box>
        )}
        {/* === /AI recommendations === */}
      </Box>
    </Box>
  );
}
