import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Stack,
  Chip,
  Skeleton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { Link as RouterLink } from "react-router-dom";

/* ---------- helpers ---------- */
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

/* ---------- animations ---------- */
const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-6px) }
  100% { transform: translateY(0) }
`;
const shimmer = keyframes`
  0% { background-position: 0% 50% }
  100% { background-position: 200% 50% }
`;

/* ---------- component ---------- */
export default function StorySplit({
  eyebrow = "Our Story",
  title = "How We Became!",
  subtitle = "Mala & Moyo — calm & heart",
  body = `The name Mala & Moyo was inspired by the Swahili words for “calm” and “heart.” 
It beautifully captures who we are: a brand that evokes tranquility and emotional connection.
Each scent in our collection is crafted to spark cherished memories and invite warmth into your space.`,
  quote = "“A single candle can light a thousand more without diminishing itself.”",
  quoteAuthor = "Hillel the Elder",
  ctaText = "Shop Now",
  ctaHref = "/shop",
  section,
  image,
  bg = "#121316",
}) {
  const [apiImg, setApiImg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("ordering", "ordering,-id");
        if (section) qs.set("section", section);
        const res = await fetch(`/api/marketing-images/?${qs}`, {
          credentials: "include",
        });
        const data = await res.json();
        const first = (Array.isArray(data) ? data : data?.results || [])[0];
        const url =
          first?.image || first?.image_url || first?.file || first?.url || first?.thumbnail;
        if (alive) setApiImg(url ? resolveUrl(url) : null);
      } catch {
        if (alive) setApiImg(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [section]);

  const heroImage = useMemo(
    () => resolveUrl(apiImg || image || "/media/placeholder.png"),
    [apiImg, image]
  );

  return (
    <Box sx={{     background:
        "linear-gradient(135deg, #0f0c0a, #1c1612, #27211d, #1a1511)", py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Card
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: 5,
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            position: "relative",
          }}
        >
          {/* ✅ Shimmer bar visible on all screens */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: 10,
              width: "100%",
              background:
                "linear-gradient(90deg,#f5deb3, #a78bfa,#f5deb3,#ffe6c7)",
              backgroundSize: "200% 100%",
              animation: `${shimmer} 8s linear infinite`,
              zIndex: 2,
            }}
          />

          {/* LEFT — TEXT SECTION */}
          <CardContent
            sx={{
              flex: 1,
              p: { xs: 3, sm: 4, md: 6 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              zIndex: 3,
            }}
          >
            <Stack spacing={2.5}>
              <Chip
                label={eyebrow}
                size="small"
                sx={{
                  width: "fit-content",
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: "white",
                  fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.8rem" },
                  lineHeight: 1.1,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
              >
                {subtitle}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {body}
              </Typography>

              {(quote || quoteAuthor) && (
                <Box
                  sx={{
                    p: 2,
                    mt: 1,
                    borderLeft: "3px solid rgba(255,255,255,0.25)",
                    bgcolor: "rgba(255,255,255,0.04)",
                    borderRadius: 2,
                  }}
                >
                  {quote && (
                    <Typography
                      variant="body1"
                      sx={{ fontStyle: "italic", color: "rgba(255,255,255,0.9)" }}
                    >
                      {quote}
                    </Typography>
                  )}
                  {quoteAuthor && (
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}
                    >
                      — {quoteAuthor}
                    </Typography>
                  )}
                </Box>
              )}

              {/* ✅ Buttons below content, not overlapping image */}
              <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
                <Button
                  component={RouterLink}
                  to={ctaHref}
                  variant="contained"
                  sx={{
                    borderRadius: 999,
                    px: { xs: 2.5, sm: 3.5 },
                    py: { xs: 0.8, sm: 1.2 },
                    fontWeight: 700,
                    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                    animation: `${float} 6s ease-in-out infinite`,
                    background:  "linear-gradient(#f5deb3, #f5deb3, #f5deb3)",
                    color:'black'

                  }}
                >
                  {ctaText}
                </Button>

                <Button
                  component={RouterLink}
                  to="/about"
                  variant="text"
                  sx={{
                    color: "#aaa",
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  }}
                >
                  Learn more
                </Button>
              </Stack>
            </Stack>
          </CardContent>

          {/* RIGHT — IMAGE */}
          {loading ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={300}
              sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.08)" }}
            />
          ) : (
            <CardMedia
              component="img"
              image={heroImage}
              alt={title}
              sx={{
                width: { xs: "100%", md: 550 }, // ✅ smaller image on small screens
                height: { xs: 200, sm: 250, md: "auto" },
                objectFit: "cover",
                filter: "contrast(1.05)",
                transition: "transform 0.5s ease",
                "&:hover": { transform: "scale(1.03)" },
              }}
            />
          )}
        </Card>
      </Container>
    </Box>
  );
}
