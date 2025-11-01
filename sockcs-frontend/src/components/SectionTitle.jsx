// src/components/SectionTitle.jsx
import { Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import "@fontsource/dancing-script"; // for a warm, welcoming feel

const SectionTitle = ({ title, subtitle, center = true }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      sx={{
        textAlign: center ? "center" : "left",
        mb: subtitle ? 4 : 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "'Dancing Script', cursive",
          fontWeight: 700,
          color: "white",
          fontSize: { xs: "1.9rem", md: "2.4rem" },
          letterSpacing: "0.5px",
          mb: subtitle ? .5 : 0,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            color: "rgba(200,205,255,0.7)",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            maxWidth: 600,
            mx: center ? "auto" : 0,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default SectionTitle;
