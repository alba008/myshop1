// src/components/WhyChooseUs.jsx
import { Container, Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";

// Theme tokens (same vibe as Login/Account)
const GOLD = "#f5deb3";
const GOLD_SOFT = "rgba(245,222,179,.35)";
const TEXT = "rgba(255,255,255,.96)";
const TEXT_DIM = "rgba(255,255,255,.70)";
const CARD_BG = "rgba(255,255,255,.06)";
const CARD_BORDER = "rgba(255,255,255,.10)";

// Little motion helper
const fadeUp = (i) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay: i * 0.12, ease: "easeOut" },
  viewport: { once: true, margin: "-80px" },
});

export default function WhyChooseUs({ SectionTitle }) {
  const features = [
    {
      icon: "🌿",
      title: "Eco-Friendly Materials",
      text: "Natural soy wax and reusable glass jars for a cleaner burn.",
    },
    {
      icon: "🕯️",
      title: "Handcrafted with Love",
      text: "Each candle is poured by hand with careful attention to detail.",
    },
    {
      icon: "🧘",
      title: "Calm-Inspired Scents",
      text: "Aroma profiles designed to bring ease and serenity to your space.",
    },
    {
      icon: "🚚",
      title: "Fast & Reliable Shipping",
      text: "Packed with care and delivered quickly to your doorstep.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      {/* Heading */}
      <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
        <SectionTitle
          title="Why Choose Mala & Moyo"
          subtitle="Hand-poured love, sustainable care, and lasting memories."
        />
      </Box>

      {/* Feature Cards */}
      <Grid container spacing={{ xs: 2.25, md: 3 }}>
        {features.map((item, i) => (
          <Grid item xs={6} sm={6} md={3} key={item.title}>
            <motion.div {...fadeUp(i)}>
              <Card
                elevation={0}
                sx={{
                  position: "relative",
                  height: "100%",
                  borderRadius: 3,
                  bgcolor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  p: 2,
                  overflow: "hidden",
                  transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: GOLD_SOFT,
                    boxShadow: "0 10px 28px rgba(0,0,0,.35)",
                  },
                  // subtle gold glow ring on hover
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    borderRadius: 12,
                    background:
                      "radial-gradient(120px 60px at 20% 0%, rgba(245,222,179,.20), transparent 60%), " +
                      "radial-gradient(140px 70px at 100% 100%, rgba(245,222,179,.12), transparent 60%)",
                    opacity: 0.35,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  {/* Icon bubble */}
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "999px",
                      mb: 1.5,
                      background:
                        "linear-gradient(90deg, rgba(245,222,179,.22), rgba(202,164,108,.22))",
                      border: `1px solid ${GOLD_SOFT}`,
                    }}
                  >
                    <Typography aria-hidden sx={{ fontSize: 24 }}>{item.icon}</Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: TEXT,
                      mb: 0.75,
                      letterSpacing: 0.2,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: TEXT_DIM,
                      fontSize: ".95rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
