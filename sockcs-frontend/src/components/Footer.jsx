// src/components/Footer.jsx
import { useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MUILink,
  IconButton,
  TextField,
  Button,
  Stack,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

// Icons
import HomeIcon from "@mui/icons-material/HomeRounded";
import StorefrontIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagRounded";
import PersonIcon from "@mui/icons-material/PersonRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import SendIcon from "@mui/icons-material/SendRounded";

/**
 * Footer
 * Props:
 *  - cartCount?: number (optional; shows badge on mobile cart icon)
 */
export default function Footer({ cartCount = 0 }) {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Active tab for mobile bottom nav
  const current = useMemo(() => {
    if (location.pathname.startsWith("/shop") || location.pathname.startsWith("/products")) return "shop";
    if (location.pathname.startsWith("/cart")) return "cart";
    if (location.pathname.startsWith("/account")) return "account";
    return "home";
  }, [location.pathname]);

  return (
    <>
      {/* DESKTOP/TABLET FOOTER */}
      <Box
        component="footer"
        sx={{
          display: { xs: "none", md: "block" },
          mt: 0,
          pt: 6,
          pb: 6,
          bgcolor: "#000", // black background
          color: "#fff",   // white text
        }}
      >
        <Container maxWidth="lg" sx={{color: "#f5deb3"}}>
          <Grid container spacing={4}>
            {/* Brand + socials */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Malamoyo
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5, color: '#f5deb3' }}>
                Premium socks and essentials you’ll actually want to wear. Comfort first, style always.
              </Typography>

              <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                {[TwitterIcon, InstagramIcon, FacebookIcon, GitHubIcon].map((Icon, i) => (
                  <IconButton
                    key={i}
                    size="small"
                    sx={{ color: "#fff", "&:hover": { color: "#22c55e" } }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                ))}
              </Stack>
            </Grid>

            {/* Shop links */}
            <Grid item xs={6} md={2}>
              <SectionTitle>Shop</SectionTitle>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/shop">All Products</NavLink>
              <NavLink to="/shop?category=Men">Men</NavLink>
              <NavLink to="/shop?category=Women">Women</NavLink>
              <NavLink to="/cart">Cart</NavLink>
            </Grid>

            {/* Company links */}
            <Grid item xs={6} md={2}>
              <SectionTitle>Company</SectionTitle>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <NavLink to="/faq">FAQ</NavLink>
              <NavLink to="/returns">Returns</NavLink>
              <NavLink to="/shipping">Shipping</NavLink>
            </Grid>

            {/* Newsletter */}
            <Grid item xs={12} md={4}>
              <SectionTitle>Stay in the loop</SectionTitle>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1.25 }}>
                Get product drops, special offers, and more—straight to your inbox.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ maxWidth: 420 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    input: { color: "#fff" },
                    "& .MuiOutlinedInput-root fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#22c55e" },
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#22c55e" },
                  }}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={() => {
                    if (!email.trim()) return;
                    setEmail("");
                  }}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    fontWeight: 600,
                    height: "30px",
                    background:
                    "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                  color: "#121212",
                  boxShadow: "0 0 15px rgba(222,240,255,0.8)",
                  "&:hover": {
                    borderColor: "#00f0ff",
                    color: "#fff",
                    boxShadow: "0 0 15px rgba(222,240,255,0.1)",
                  },
                   borderColor: "#fff",

                  }}                >
                  Subscribe
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.15)" }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="caption" sx={{  color: "#f5deb3" }}>
              © {year} Malamoyo. All rights reserved.
            </Typography >
            <Stack sx={{color:"#f5deb3"}} direction="row" spacing={2} color= "#f5deb3">
              <TinyLink to="/privacy">Privacy</TinyLink>
              <TinyLink to="/terms">Terms</TinyLink>
              <TinyLink to="/cookies">Cookies</TinyLink>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* MOBILE BOTTOM NAV */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          pb: 1,
          left: 0,
          right: 0,
          bgcolor: "#000",
          color: "#f5deb3",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 -6px 16px rgba(0,0,0,0.6)",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <BottomNavigation
          showLabels
          value={current}
          onChange={(_, val) => {
            if (val === "home") navigate("/");
            if (val === "shop") navigate("/shop");
            if (val === "cart") navigate("/cart");
            if (val === "account") navigate("/account");
          }}
          sx={{
            bgcolor: "#000",
            "& .MuiBottomNavigationAction-root": {
              color: "#f5deb3",
              "&.Mui-selected": { color: "#22c55e" }, // green highlight
            },
          }}
        >
          <BottomNavigationAction label="Home" value="home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Shop" value="shop" icon={<StorefrontIcon />} />
          <BottomNavigationAction
            label="Cart"
            value="cart"
            icon={
              <Badge
                sx={{ "& .MuiBadge-badge": { bgcolor: "#22c55e", color: "#000" } }}
                badgeContent={cartCount}
                invisible={!cartCount}
              >
                <ShoppingBagIcon />
              </Badge>
            }
          />
          <BottomNavigationAction label="Account" value="account" icon={<PersonIcon />} />
        </BottomNavigation>
      </Box>
    </>
  );
}

/* ---------- Helpers ---------- */
function SectionTitle({ children }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 700, mb: 1, color: "#fff" }} // forced white
    >
      {children}
    </Typography>
  );
}

function NavLink({ to, children }) {
  return (
    <Typography variant="body2" sx={{ mb: 0.75 }}>
      <MUILink
        component={RouterLink}
        to={to}
        underline="none"
        sx={{
          color: "#fff", // white text
          "&:hover": { color: "#22c55e" }, // green hover
        }}
      >
        {children}
      </MUILink>
    </Typography>
  );
}

function TinyLink({ to, children }) {
  return (
    <MUILink
      component={RouterLink}
      to={to}
      underline="none"
      sx={{
        color: "#fff", // white text
        "&:hover": { color: "#22c55e" }, // green hover
      }}
    >
      <Typography variant="caption">{children}</Typography>
    </MUILink>
  );
}
