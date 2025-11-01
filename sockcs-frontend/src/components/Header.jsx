// src/components/Header.jsx
import { useState, useMemo } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Badge,
  Button,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Link as RouterLink } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import TopBar from "./TopBar";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user, logout } = useAuth();

  // derive admin visibility once per render
  const canSeeAdmin = useMemo(() => {
    const u = user || {};
    const roles = Array.isArray(u.roles) ? u.roles.map(String) : [];
    return Boolean(
      u.is_staff ||
      u.is_superuser ||
      u.role === "staff" ||
      u.role === "admin" ||
      roles.includes("staff") ||
      roles.includes("admin")
    );
  }, [user]);

  const from = {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };

  return (
    <>
      {/* ----- NAVBAR ----- */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(12px)",
          background: "rgba(0, 0, 0, 1)",
          borderBottom: "1px solid rgba(222,240,255,0.3)",
          boxShadow: "0 0 15px rgba(222,240,255,0.3)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 4 },
          }}
        >
          {/* LOGO */}
          <Typography
            variant="h6"
            fontWeight="900"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: "none",
              background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 1.5,
            }}
          >
            Malamoyo
          </Typography>

          {/* DESKTOP NAV */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {[
              { label: "Home", to: "/" },
              { label: "Shop", to: "/shop" },
              { label: "About", to: "/about" },
              { label: "Contact", to: "/contact" },
            ].map((item) => (
              <Button
                key={item.label}
                component={RouterLink}
                to={item.to}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  color: "#f5deb3",
                  "&:hover": {
                    color: "#fff",
                    textShadow: "0 0 10px #fff",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}

            {/* ADMIN (SPA) — visible only to staff/superuser */}
            {canSeeAdmin && (
              <Button
                component={RouterLink}
                to="/staff/enquiries"
                startIcon={<AdminPanelSettingsIcon />}
                sx={{
                  textTransform: "none",
                  color: "#f5deb3",
                  "&:hover": { color: "#fff" },
                }}
              >
                Admin
              </Button>
            )}

            {/* AUTH BUTTONS */}
            {user ? (
              <>
                <Button
                  component={RouterLink}
                  to="/account"
                  sx={{ textTransform: "none", color: "#E0E0E0" }}
                >
                  Account
                </Button>
                <Button
                  onClick={logout}
                  sx={{
                    textTransform: "none",
                    color: "#f5deb3",
                    "&:hover": { color: "#FF6B6B" },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  state={{ from }}
                  sx={{
                    textTransform: "none",
                    color: "#f5deb3",
                    "&:hover": { color: "#FFF" },
                    textShadow: "0 0 15px rgba(222,240,255,0.8)",
                  }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    fontWeight: 600,
                    background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                    color: "#121212",
                    boxShadow: "0 0 15px rgba(222,240,255,0.8)",
                    "&:hover": {
                      borderColor: "#00f0ff",
                      color: "#fff",
                      boxShadow: "0 0 15px rgba(222,240,255,0.1)",
                    },
                    borderColor: "#fff",
                  }}
                >
                  Sign up
                </Button>
              </>
            )}

            {/* CART BUTTON */}
            <Button
              component={RouterLink}
              to="/cart"
              variant="outlined"
              startIcon={
                <Badge badgeContent={count} color="secondary">
                  <ShoppingBagIcon
                    sx={{
                      color: "#fff",
                      "&:hover": {
                        borderColor: "#00f0ff",
                        color: "#f5deb3",
                        boxShadow: "0 0 15px rgba(222,240,255,0.1)",
                      },
                    }}
                  />
                </Badge>
              }
              sx={{
                borderColor: "#f5deb3",
                borderRadius: "20px",
                textTransform: "none",
                color: "#f5deb3",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#f5deb3",
                  color: "#fff",
                  boxShadow: "0 0 15px rgba(222,240,255,0.6)",
                },
              }}
            >
              Cart
            </Button>
          </Box>

          {/* MOBILE MENU ICON */}
          <IconButton
            onClick={() => setOpen(true)}
            edge="end"
            sx={{ display: { xs: "flex", md: "none" }, color: "#E0E0E0" }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ----- MOBILE DRAWER ----- */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            p: 2,
            bgcolor: "#121212",
            color: "#f5deb3",
          },
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            mb: 1,
            background: "#f5deb3",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            fontFamily: "'Orbitron', sans-serif",
            color: "#f5deb3",
          }}
        >
          Menu
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }} />

        <List>
          {[
            { label: "Home", to: "/" },
            { label: "Shop", to: "/shop" },
            { label: "About", to: "/about" },
            { label: "Contact", to: "/contact" },
          ].map((item) => (
            <ListItem key={item.label} disablePadding onClick={() => setOpen(false)}>
              <Button
                component={RouterLink}
                to={item.to}
                sx={{
                  justifyContent: "flex-start",
                  width: "100%",
                  textTransform: "none",
                  color: "#f5deb3",
                  "&:hover": { color: "#fff" },
                }}
              >
                <ListItemText primary={item.label} />
              </Button>
            </ListItem>
          ))}

          {/* ADMIN LINK (mobile) — only for staff/superuser */}
          {canSeeAdmin && (
            <ListItem disablePadding onClick={() => setOpen(false)}>
              <Button
                component={RouterLink}
                to="/staff/enquiries"
                startIcon={<AdminPanelSettingsIcon />}
                sx={{
                  justifyContent: "flex-start",
                  width: "100%",
                  textTransform: "none",
                  color: "#f5deb3",
                  "&:hover": { color: "#fff" },
                }}
              >
                Admin
              </Button>
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* AUTH IN DRAWER */}
        {user ? (
          <>
            <Button
              component={RouterLink}
              to="/account"
              fullWidth
              onClick={() => setOpen(false)}
              sx={{ textTransform: "none", color: "#E0E0E0" }}
            >
              Account
            </Button>
            <Button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              fullWidth
              sx={{
                textTransform: "none",
                color: "#F87171",
                "&:hover": { color: "#FF6B6B" },
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              component={RouterLink}
              to="/login"
              fullWidth
              onClick={() => setOpen(false)}
              sx={{ textTransform: "none", color: "#E0E0E0" }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              fullWidth
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                color: "#121212",
                boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                "&:hover": {
                  background: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
                },
                borderRadius: "20px",
              }}
              onClick={() => setOpen(false)}
            >
              Sign up
            </Button>
          </>
        )}

        {/* CART */}
        <Button
          component={RouterLink}
          to="/cart"
          startIcon={
            <Badge badgeContent={count} color="secondary">
              <ShoppingBagIcon sx={{ color: "#333" }} />
            </Badge>
          }
          onClick={() => setOpen(false)}
          sx={{
            mt: 3,
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 600,
            border: "1px solid rgba(255,212,150,0.25)",
            background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
            color: "#121212",
            boxShadow: "0 0 20px rgba(255,215,150,0.25)",
            "&:hover": {
              background: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
              boxShadow: "0 0 25px rgba(255,215,150,0.4)",
            },
          }}
        >
          Cart
        </Button>
      </Drawer>
    </>
  );
}
