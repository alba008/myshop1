import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Stack,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Link as RouterLink } from "react-router-dom";


const DJANGO = "http://10.0.0.47:8000";

const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try {
    new URL(u);
    return u;
  } catch {
    return String(u).startsWith("/media/") ? `${DJANGO}${u}` : u;
  }
};

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

async function getFirstGalleryImage(productId) {
  try {
    const res = await fetch(`/api/product-images/?product=${productId}`, { credentials: "include" });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    const first =
      rows.find((g) => g.image || g.image_url || g.file || g.url || g.thumbnail) || rows[0];
    const url = first?.image || first?.image_url || first?.file || first?.url || first?.thumbnail;
    return resolveUrl(url);
  } catch {
    return "";
  }
}

export default function FeaturedProductsGrid({ title = "Featured", limit = 12, showMoreLink }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [galleryMap, setGalleryMap] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        const res = await fetch(`/api/products/`, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const trimmed = items.slice(0, limit);
        if (!alive) return;
        setRows(trimmed);

        // Load first gallery image for each product
        const map = {};
        await Promise.all(
          trimmed.map(async (p) => {
            const best =
              p.image || p.image_url || (await getFirstGalleryImage(p.id)) || "/media/placeholder.png";
            map[p.id] = resolveUrl(best);
          })
        );
        if (alive) setGalleryMap(map);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load products");
      }
    })();
    return () => {
      alive = false;
    };
  }, [limit]);

  const items = useMemo(() => rows || [], [rows]);

  return (
    <Box sx={{ py: 0, px: { xs: 2, md: 4 } }}>
      {/* Section header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 3 }}
        spacing={1.5}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff" }}>
        </Typography>
        {showMoreLink && (
          <Button
            component={RouterLink}
            to={showMoreLink}
            endIcon={<ArrowForwardIosIcon />}
            sx={{
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { color: "#90caf9" },
            }}
          >
            View all
          </Button>
        )}
      </Stack>

      {/* Error message */}
      {err && (
        <Typography color="error" sx={{ mb: 2 }}>
          {err}
        </Typography>
      )}

      {/* Scrollable product list */}
      {!rows ? (
        <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 2 }}>
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={260}
              height={300}
              sx={{ borderRadius: 3, flex: "0 0 auto" }}
            />
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            pb: 2,
            gap: 2,
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {items.map((p) => {
            const img =
              galleryMap[p.id] || resolveUrl(p.image || p.image_url) || "/media/placeholder.png";
            const slug =
              (p.slug || p.name || "")
                .toString()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "") || p.id;

            return (
              <Card
                key={p.id}
                component={RouterLink}
                to={`/products/${p.id}/${slug}`}
                sx={{
                  flex: "0 0 22%", // 4 cards per row on md screens
                  minWidth: 200,
                  maxWidth: 100,
                  textDecoration: "none",
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 0,
                  overflow: "hidden",
                  transition: "transform .3s ease, box-shadow .3s ease",
                  "&:hover": {
                    transform: "scale(1.03)",
                    boxShadow: "0 12px 30px rgba(0,0,0,.4)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={img}
                  alt={p.name}
                  onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                  sx={{
                    height: 150,
                    objectFit: "cover",
                  }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#fff", mb: 0.5 }}
                    noWrap
                  >
                    {p.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
                    noWrap
                  >
                    {p.description || "—"}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "#90caf9" }}>
                    {fmtMoney(p.price ?? p.unit_price ?? 0)}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
