import React from "react";
import Slider from "react-slick";
import { Box, Typography, Button } from "@mui/material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


// Example banner images
const banners = [
  {
    image: "https://source.unsplash.com/1600x600/?technology,shop",
    title: "Latest Tech Deals",
    subtitle: "Discover gadgets at unbeatable prices",
    cta: "Shop Now",
    link: "/shop",
  },
  {
    image: "https://source.unsplash.com/1600x600/?electronics,gadgets",
    title: "Smart Electronics",
    subtitle: "Upgrade your lifestyle with premium devices",
    cta: "Explore",
    link: "/shop",
  },
  {
    image: "https://source.unsplash.com/1600x600/?shopping,tech",
    title: "Shop Smarter",
    subtitle: "Find the best products curated for you",
    cta: "Browse",
    link: "/shop",
  },
];

export default function Banner() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: false,
  };

  return (
    <Box sx={{ width: "100%", minHeight: 300, mb: 4 }}>
      <Slider {...settings}>
        {banners.map((b, i) => (
          <Box
            key={i}
            sx={{
              position: "relative",
              height: { xs: 300, md: 400 },
              width: "100%",
              backgroundImage: `url(${b.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                textAlign: "center",
                p: 2,
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ mb: 1, fontSize: { xs: "1.5rem", md: "2.5rem" } }}
              >
                {b.title}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontSize: { xs: "0.9rem", md: "1.2rem" } }}
              >
                {b.subtitle}
              </Typography>
              <Button
                href={b.link}
                variant="contained"
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  fontWeight: "bold",
                }}
              >
                {b.cta}
              </Button>
            </Box>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}
