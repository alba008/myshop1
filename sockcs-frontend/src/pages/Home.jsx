import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
} from "@mui/material";
import { keyframes } from "@mui/system";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FeaturedProductsGrid from "../components/FeaturedProductsGrid";
import ProductGrid from "../components/ProductGrid";
import StorySplit from "../components/StorySplit";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import MarketingGrid from "../components/MarketingGrid";
import SectionTitle from "../components/SectionTitle";
import WhyChooseUs from "../components/WhyChooseUs";



export default function Home() {
  return (
    <Box sx={{ bgcolor: "#0d0f12", color: "rgba(255,255,255,.92)" }}>
      {/* HERO SECTION (your existing code) */}

      {/* 👇 Marketing grid section */}
      <MarketingGrid />

      {/* PRODUCTS */}
      <Box sx={{ py: { xs: 2, md: 2 } }}>
      <SectionTitle title="Featured" />

        <Container maxWidth="lg">
          <ProductGrid limit={3} showMoreLink="/shop" />
        </Container>
      </Box>

      {/* FEATURED */}
      <Box sx={{ py: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg">
              <SectionTitle title="Best Selling" />

          <FeaturedProductsGrid
            limit={8}
            showMoreLink="/shop"
          />
        </Container>
      </Box>

      {/* STORY SPLIT */}
      <Box sx={{ py: { xs: 2, md: 3 } }}>
      <StorySplit
        title="How We Became!"
        subtitle="Mala & Moyo — calm & heart"
        image="/media/marketing/hero_candle.jpg"
        ctaText="Shop Now"
        ctaHref="/shop"
      />
       </Box>

      {/* NEW ARRIVALS */}
      <Box sx={{ py: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg">
        <SectionTitle title="New Arrival" />
          <FeaturedProductsGrid
        
      limit={8}
            showMoreLink="/shop?sort=newest"
            variant="dark"
          />
        </Container>
      </Box>

      {/* WHY BUY & TESTIMONIALS */}
      <Box sx={{ py: { xs: 2, md: 3 } }}>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
              
        <Box
          sx={{
            py: { xs: 8, md: 10 },
            background:
              "radial-gradient(circle at 30% 10%, rgba(255,200,150,.05), transparent 60%), radial-gradient(circle at 80% 20%, rgba(170,210,255,.04), transparent 60%)",
            borderTop: "1px solid rgba(255,255,255,.05)",
          }}
        >
          <Container maxWidth="lg">
            {/* WHY CHOOSE US */}
  

            <WhyChooseUs SectionTitle={SectionTitle} />


            {/* TESTIMONIALS */}
            <Box sx={{ mt: { xs: 4, md: 5 }, textAlign: "center" }}>
            <SectionTitle
            title="What Our Customers Say"/>
              <Typography sx={{ color: "rgba(255,255,255,.65)", mb: 5 }}>
                Real words from those who light up their space with us.
              </Typography>

              <Grid container spacing={3}>
                {[
                  {
                    name: "Sarah M.",
                    quote:
                      "These candles transformed my evenings — calming and long-lasting scent.",
                  },
                  {
                    name: "David K.",
                    quote:
                      "Beautiful craftsmanship! You can feel the love in every pour.",
                  },
                  {
                    name: "Lina W.",
                    quote:
                      "The packaging feels premium, and the scent is simply peaceful.",
                  },
                ].map((t, i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: i * 0.2,
                        ease: "easeOut",
                      }}
                      viewport={{ once: true }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          p: 3,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,.05)",
                          border: "1px solid rgba(255,255,255,.08)",
                          backdropFilter: "blur(8px)",
                          transition: "all 0.3s ease",
                          "&:hover": { transform: "translateY(-6px)" },
                        }}
                      >
                        <Typography
                          sx={{
                            fontStyle: "italic",
                            color: "rgba(255,255,255,.85)",
                            mb: 2,
                          }}
                        >
                          “{t.quote}”
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "rgba(255,255,255,.65)",
                            fontWeight: 600,
                          }}
                        >
                          — {t.name}
                        </Typography>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
          </Container>
        </Box>
      </motion.div>
      </Box>

    </Box>
  );
}
