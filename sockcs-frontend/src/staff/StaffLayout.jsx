// src/staff/StaffLayout.jsx
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Box, Drawer, Stack, IconButton, Typography, Divider, Button, Avatar, Tooltip,
  List, ListItemButton, ListItemText
} from "@mui/material";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const NAV_W = 260;
const BG = "linear-gradient(180deg,#0e0f12 0%, #14161a 100%)";
const CARD_BG = "rgba(255,255,255,.06)";
const BORDER = "rgba(255,255,255,.10)";
const GOLD = "#f5deb3";
const TEXT = "rgba(255,255,255,.96)";
const DIM = "rgba(255,255,255,.72)";

const items = [
  { to: "/staff",            label: "Dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { to: "/staff/enquiries",  label: "Enquiries", icon: <AdminPanelSettingsIcon sx={{ fontSize: 20 }} /> },
  { to: "/staff/orders",     label: "Orders",    icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} /> },
  { to: "/staff/products",   label: "Products",  icon: <Inventory2OutlinedIcon sx={{ fontSize: 20 }} /> },
  { to: "/staff/customers",  label: "Customers", icon: <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} /> },
  { to: "/staff/inventory",  label: "Inventory", icon: <Inventory2OutlinedIcon sx={{ fontSize: 20 }} /> },
];

function wipeAuth() {
  try {
    localStorage.removeItem("auth.tokens");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("staff_token");
    localStorage.removeItem("is_staff");
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    sessionStorage.removeItem("staff_token");
    sessionStorage.removeItem("is_staff");
  } catch {}
}

export default function StaffLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentTitle =
    items.find(it => loc.pathname === it.to || loc.pathname.startsWith(it.to + "/"))?.label || "Dashboard";

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: `${NAV_W}px 1fr`, background: BG, color: TEXT }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        PaperProps={{
          sx: {
            width: NAV_W, boxSizing: "border-box",
            background: "rgba(255,255,255,.03)", borderRight: `1px solid ${BORDER}`, backdropFilter: "blur(8px)"
          }
        }}
      >
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar alt={user?.username || "Staff"} sx={{ bgcolor: GOLD, color: "#121212", width: 32, height: 32, fontWeight: 900 }}>
                {(user?.username || "S").slice(0,1).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" sx={{ color: GOLD, fontWeight: 900 }}>Staff Console</Typography>
            </Stack>
            <IconButton size="small"><MenuOpenIcon sx={{ color: DIM }} /></IconButton>
          </Stack>
          <Divider sx={{ borderColor: BORDER }} />

          <List dense>
            {items.map((it) => (
              <ListItemButton
                key={it.to}
                component={NavLink}
                to={it.to}
                end={it.to === "/staff"} // exact match for index
                sx={{
                  borderRadius: 2,
                  "&.active": {
                    color: "#121212",
                    background: GOLD,
                  },
                  "&:not(.active)": {
                    color: TEXT,
                    "&:hover": { background: "rgba(255,255,255,.06)" },
                  },
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center">
                  {it.icon}
                  <ListItemText primary={it.label} />
                </Stack>
              </ListItemButton>
            ))}
          </List>
        </Stack>

        <Box sx={{ flex: 1 }} />
        <Box sx={{ p: 2 }}>
          <Tooltip title="Sign out">
            <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                try { await logout(); } catch {}
                wipeAuth();
                navigate("/login", { replace: true });
              }}
              startIcon={<LogoutIcon />}
              sx={{ color: GOLD, borderColor: GOLD, "&:hover": { borderColor: GOLD } }}
            >
              Sign out
            </Button>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main */}
      <Box sx={{ p: 2.5 }}>
        <Stack
          component={motion.div}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4 }}
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2, py: 1.25, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: CARD_BG, mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, color: GOLD }}>{currentTitle}</Typography>
          <Typography variant="body2" sx={{ color: DIM }}>{new Date().toLocaleString()}</Typography>
        </Stack>

        <Outlet />
      </Box>
    </Box>
  );
}
