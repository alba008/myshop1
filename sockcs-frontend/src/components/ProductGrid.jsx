// src/components/MarketingGrid.jsx
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Card, CardActionArea, Skeleton, Typography, Stack, Button } from "@mui/material";
import http, { api } from "../lib/http";

const DJANGO = "http://10.0.0.47:8000";
const resolveUrl = (u) => {
  if (!u) return "/media/placeholder.png";
  try { return new URL(u).toString(); } catch {
    const s = String(u).trim();
    if (s.startsWith("/media/")) return `${DJANGO}${s}`;
    if (/^(products|marketing|gallery)\//i.test(s)) return `${DJANGO}/media/${s}`;
    if (/^[\w\-]+\.(jpe?g|png|gif|webp)$/i.test(s)) return `${DJANGO}/media/${s}`;
    return s;
  }
};

const normalize = (row) => ({
  id: row.id,
  title: row.title || row.name || "",
  subtitle: row.subtitle || row.caption || "",
  _image: resolveUrl(row.image || row.image_url || row.file || row.url || row.thumbnail || ""),
});

export default function MarketingGrid({
  title = "Explore the Collection",
  ids,                                 // e.g. [1,2,5] — if provided we fetch exactly these
  section,                              // optional filter for list endpoint
  limit = 4,                            // applies to list endpoint
  endpoint = "/api/marketing-images/?ordering=-id",
  ctaText = "Shop Now",
  ctaLink = "/shop",
}) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        let items = [];
        if (Array.isArray(ids) && ids.length) {
          // Fetch exact IDs in parallel
          const results = await Promise.all(
            ids.map((id) =>
              api(`/api/marketing-images/${id}/`, { credentials: "include" }).catch((e) => {
                console.warn("Failed to fetch marketing image id", id, e);
                return null;
              })
            )
          );
          items = results.filter(Boolean).map(normalize);
        } else {
          // Fallback to list endpoint
          const url = section ? `${endpoint}&section=${encodeURIComponent(section)}` : endpoint;
          const data = await api(url, { credentials: "include" });
          const list = Array.isArray(data) ? data : (data?.results || []);
          items = list.map(normalize);
          if (limit) items = items.slice(0, limit);
        }

        if (!alive) return;
        setRows(items);
      } catch (err) {
        // If you still hit HTML, you’ll see a helpful error here
        console.error("Error loading marketing images:", err);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [ids, section, endpoint, limit]);

  const display = useMemo(() => Array.isArray(rows) ? rows : [], [rows]);

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 4 }, my: { xs: 4, md: 8 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, fontSize:{xs:14, md: 20}, letterSpacing: 0.2, color: "rgba(245, 222, 179, 0.9)" }}>
          {title}
        </Typography>
        <Button component={RouterLink} to={ctaLink} variant="outlined" size="small" sx={{ borderRadius: 999, 
        width: {xs: '100px'},
        borderColor:  "#f5deb3",
        color: 'white'
      }}>
          Shop all
        </Button>
      </Stack>

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, sm: 3, md: 4 },
          gridTemplateColumns: {
            xs: "repeat(1, minmax(140px, 1fr))",
            sm: "repeat(1, minmax(180px, 1fr))",
            md: "repeat(3, minmax(240px, 1fr))",
          },
          alignItems: "stretch",
        }}
      >
        {loading
          ? Array.from({ length: ids?.length || limit }).map((_, i) => (
              <Card key={`s-${i}`} elevation={0} sx={{ height: { xs: 200, sm: 260, md: 320 }, borderRadius: 2, overflow: "hidden" }}>
                <Skeleton variant="rectangular" height="100%" />
              </Card>
            ))
          : display.map((row) => (
              <Card
                key={row.id}
                elevation={0}
                sx={{
                  position: "relative",
                  height: { xs: 200, sm: 260, md: 320 },
                  width: { xs: '100%'  },

                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: "transparent",
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={ctaLink}
                  sx={{ width: "100%", height: "100%", position: "relative", "&:hover img": { transform: "scale(1.05)" } }}
                >
                  <Box
                    component="img"
                    src={row._image}
                    alt={row.title || "Marketing"}
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/media/placeholder.png")}
                    sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", transition: "transform .45s ease" }}
                  />

                  {/* Overlay + CTA */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%)",
                      color: "white",
                      textAlign: "center",
                      p: 2,
                    }}
                  >
                    {row.title && (
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textShadow: "0 2px 8px rgba(245, 222, 179, 0.35)" }}>
                        {row.title}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      sx={{
                        px: { xs: 2.5, sm: 3.5, md: 4 },
                        py: { xs: 0.75, md: 1 },
                        fontSize: { xs: "0.85rem", md: "1rem" },
                        borderRadius: 1,
                        border: "0.1px solid rgba(255,255,255,0.7)",
                        fontWeight: 700,
                        bgcolor: "rgba(2,15,15,0.3)",
                        color: "white",
                        textTransform: "none",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        transition: "all .3s ease",
                        "&:hover": { bgcolor: "white", color: "black", border: "2px solid black", transform: "translateY(-3px)" },
                        width:{xs: '70px'}
                      }}
                    >
                      {ctaText}
                    </Button>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
      </Box>
    </Box>
  );
}
