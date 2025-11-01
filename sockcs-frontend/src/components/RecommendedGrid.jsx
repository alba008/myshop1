// src/components/RecommendedGrid.jsx
import React, { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Tooltip,
  Slider,
  Chip,
  Stack,
  Skeleton,
  Divider,
  Button,
} from "@mui/material";
import { RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";

// --- CONFIG: where your Django API serves media ---
const API_BASE = import.meta.env.VITE_API_BASE || "http://10.0.0.47:8000";

// A tiny, built-in fallback image so we never 404.
// (No file needed; works even if media is down.)
const FALLBACK_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
       <rect width="100%" height="100%" fill="#f2f2f2"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             fill="#888" font-family="Arial, Helvetica, sans-serif" font-size="20">
         No Image
       </text>
     </svg>`
  );

// Build a usable media URL for anything the backend returns
function mediaUrl(value) {
  if (!value) return null;
  const s = String(value).trim();

  // If it's already absolute, pass through
  if (/^https?:\/\//i.test(s)) return s;

  // If backend gave us a /media/... path, prefix with API_BASE
  if (s.startsWith("/media/")) return API_BASE + s;

  // If backend gave us a bare filename or a "media/..." relative path
  if (/^(media\/)?[\w\-./]+\.(jpe?g|png|gif|webp|avif)$/i.test(s)) {
    const cleaned = s.replace(/^\/+/, "");
    return `${API_BASE}/${cleaned.startsWith("media/") ? cleaned : `media/${cleaned}`}`;
  }

  // Otherwise, best effort passthrough
  return s;
}

const RECS = gql`
  query Recs($id: ID!, $first: Int) {
    recommendedProducts(productId: $id, first: $first) {
      id
      name
      price
      image
    }
  }
`;

const fmtMoney = (v) =>
  Number(v ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function RecommendedGrid({ productId, first = 12, title = "You might also like" }) {
  const { data, loading, error, refetch } = useQuery(RECS, {
    variables: { id: String(productId), first },
    fetchPolicy: "cache-and-network",
  });

  const [hidden, setHidden] = useState(new Set());
  const [liked, setLiked] = useState(new Set());
  const [budget, setBudget] = useState(null);

  const items = data?.recommendedProducts ?? [];
  const visible = useMemo(() => {
    let list = items.filter((p) => !hidden.has(p.id));
    if (budget != null) list = list.filter((p) => Number(p.price) <= budget);
    // Light re-order: liked items float up
    list.sort((a, b) => Number(liked.has(b.id)) - Number(liked.has(a.id)));
    return list;
  }, [items, hidden, liked, budget]);

  const onLike = (id) => setLiked(new Set(liked).add(id));
  const onDislike = (id) => setHidden(new Set(hidden).add(id));
  const onRefresh = async () => {
    setHidden(new Set());
    setLiked(new Set());
    await refetch();
  };
  const onMoreLikeThis = async (id) => {
    await refetch({ id, first });
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2,
        mb: 10,
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
        border: "1px solid rgba(245,222,179,0.25)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: "#f5deb3" }}
        >
          {title}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 1.5 }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
            Budget
          </Typography>
          <Box sx={{ width: 160 }}>
            <Slider
              size="small"
              min={0}
              max={100}
              step={1}
              value={budget ?? 100}
              onChange={(_, v) => setBudget(Number(v) === 100 ? null : Number(v))}
              valueLabelDisplay="auto"
              aria-label="Budget max"
            />
          </Box>
          {budget != null && (
            <Chip
              label={`≤ ${fmtMoney(budget)}`}
              size="small"
              onDelete={() => setBudget(null)}
              sx={{
                color: "#121212",
                background:
                  "linear-gradient(90deg, rgba(245,222,179,1), rgba(202,164,108,1), rgba(245,222,179,1))",
              }}
            />
          )}
        </Stack>

        <Tooltip title="Refresh suggestions">
          <IconButton onClick={onRefresh} sx={{ color: "#f5deb3" }}>
            <RefreshCw size={18} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ mb: 2, borderColor: "rgba(245,222,179,0.2)" }} />

      {loading && !data ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} item xs={6} sm={4} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Box sx={{ position: "relative", pt: "66.66%", overflow: "hidden" }}>
                  <Skeleton variant="rectangular" sx={{ position: "absolute", inset: 0 }} />
                </Box>
                <CardContent>
                  <Skeleton width="80%" />
                  <Skeleton width="40%" />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" width={60} height={28} />
                    <Skeleton variant="rounded" width={60} height={28} />
                    <Skeleton variant="rounded" width={100} height={28} sx={{ ml: "auto" }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Typography color="error">Couldn’t load recommendations.</Typography>
      ) : !visible.length ? (
        <Typography sx={{ opacity: 0.8 }}>No recommendations yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {visible.map((p) => {
            const src = mediaUrl(p?.image) || FALLBACK_PLACEHOLDER;
            return (
              <Grid key={p.id} item xs={6} sm={4} md={3}>
                <Card
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    width: { xs: 150 },
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
                      borderColor: "rgba(245,222,179,0.45)",
                    },
                  }}
                >
                  {/* Image with 3:2 ratio */}
                  <Box sx={{ position: "relative", pt: "66.66%", background: "rgba(255,255,255,0.9)" }}>
                    <CardMedia
                      component="img"
                      src={src}
                      alt={p.name}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_PLACEHOLDER) {
                          e.currentTarget.src = FALLBACK_PLACEHOLDER;
                        }
                      }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        py: 0,
                      }}
                      loading="lazy"
                    />
                  </Box>

                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.95)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 44,
                      }}
                    >
                      {p.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
                    >
                      {fmtMoney(p.price)}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                      <Tooltip title="Like">
                        <IconButton
                          size="small"
                          onClick={() => onLike(p.id)}
                          sx={{
                            height: "30px",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: liked.has(p.id) ? "#22c55e" : "rgba(255,255,255,0.9)",
                            background: liked.has(p.id) ? "rgba(34,197,94,0.12)" : "transparent",
                            "&:hover": { background: "rgba(255,255,255,0.1)" },
                          }}
                        >
                          <ThumbsUp size={15} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Hide">
                        <IconButton
                          size="small"
                          onClick={() => onDislike(p.id)}
                          sx={{
                            height: "30px",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "rgba(255,255,255,0.9)",
                            "&:hover": { background: "rgba(255,255,255,0.1)" },
                          }}
                        >
                          <ThumbsDown size={15} />
                        </IconButton>
                      </Tooltip>

                      <Box sx={{ ml: "auto" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onMoreLikeThis(p.id)}
                          sx={{
                            height: "30px",
                            textTransform: "none",
                            borderColor: "rgba(245,222,179,0.55)",
                            color: "#f5deb3",
                            fontSize: "10px",
                            "&:hover": {
                              borderColor: "#f5deb3",
                              background: "rgba(245,222,179,0.12)",
                            },
                          }}
                          startIcon={<Sparkles size={16} />}
                        >
                          {/* label intentionally empty per your UI */}
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
