import { useEffect, useState } from "react";
import { Box, Typography, Button, Grid, Container } from "@mui/material";
import { motion } from "framer-motion";
import "@fontsource/dancing-script"; // Elegant handwritten font

const MarketingGrid = () => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetch("http://10.0.0.47:8000/api/banners/?ordering=-id")
      .then((res) => res.json())
      .then((data) => {
        const result = Array.isArray(data) ? data[0] : data?.results?.[0];
        if (result) {
          setBanner(result.image || result.file || result.url);
        }
      })
      .catch((err) => console.error("Error loading banner:", err));
  }, []);

  return (
    <Box
      sx={{
        py: { xs: 5, md: 10 },
        px: { xs: 2, md: 6 },
        background:
          "linear-gradient(135deg, #0f0c0a, #1c1612, #27211d, #1a1511)",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating glow effect */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,230,200,0.2), transparent 70%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        <Grid
          container
          spacing={6}
          alignItems="center"
          justifyContent="center"
          sx={{
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* LEFT SIDE: MARKETING TEXT */}
          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: { xs: "2.5rem", md: "3.8rem" },
                fontWeight: 700,
                color: "#ffe6c7",
                textShadow: "0 0 25px rgba(255, 200, 150, 0.3)",
                mb: 2,
              }}
            >
              Light Up Every Moment
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.15rem" },
                color: "rgba(255,255,255,0.8)",
                mb: 4,
                lineHeight: 1.8,
                maxWidth: 520,
              }}
            >
              Every flame tells a story. Our handcrafted candles are made from
              pure soy wax and essential oils — designed to soothe, inspire,
              and turn any space into a sanctuary of warmth and calm.
            </Typography>

            <Button
              variant="contained"
              sx={{
                borderRadius: 0,
                border: "0.1px solid rgba(255,255,255,0.7)",
                fontWeight: 700,
                px: 5,
                py: 1.4,
                fontSize: "1.05rem",
                bgcolor: "black",
                color: "white",
                textTransform: "none",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 20px rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#ffe6c7",
                  color: "black",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 30px rgba(255, 230, 200, 0.3)",
                },
              }}
            >
              Explore Our Collection
            </Button>
          </Grid>

          {/* RIGHT SIDE: IMAGE */}
          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Box
              sx={{
                width: "100%",
                width: { xs: 350, sm: 360, md: 460 },
                height: { xs: 280, sm: 360, md: 460 },
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={
                  banner ||
                  "http://10.0.0.47:8000/media/banners/429f77b5-370e-48bc-b835-f9e61c210422_J8F2Eth.JPG"
                }
                alt="Candle Banner"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform .6s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
                onError={(e) => {
                     e.currentTarget.onerror = null;
                     e.currentTarget.src = "https://via.placeholder.com/600x400?text=No+Image";
                    }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MarketingGrid;
