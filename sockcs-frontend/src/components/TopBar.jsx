// src/components/TopBar.jsx
import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export const TOPBAR_HEIGHT = 36;

// --- name helpers (FIRST NAME ONLY) ---
function firstName(user) {
  return (user?.first_name || "").trim() || (user?.username || "User");
}
function initials(user) {
  const f = (user?.first_name || "").trim();
  const l = (user?.last_name || "").trim();
  if (f || l) return `${(f[0] || "").toUpperCase()}${(l[0] || "").toUpperCase()}`;
  const u = (user?.username || "").trim();
  return u ? u[0].toUpperCase() : "U";
}

export default function TopBar() {
  const { user } = useAuth();
  const msg = "Free shipping on orders over $50 • New fall scents are live 🍂";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        height: TOPBAR_HEIGHT,
        justifyContent: "center",
        background: 'linear-gradient(90deg, rgba(245,222,179,1), rgba(202,164,108,1), rgba(245,222,179,1))',

        color: "#f5deb3",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(245,222,179,.25)",
        zIndex: (t) => t.zIndex.appBar + 2,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: TOPBAR_HEIGHT,
          height: TOPBAR_HEIGHT,
          px: { xs: 1.25, md: 3 },
          gap: 1,
        }}
      >
        {/* LEFT: marquee */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            flex: 1,
            minWidth: 0,
            // fade edges to make it feel wider + modern
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              width: { xs: 24, md: 40 },
              zIndex: 1,
              pointerEvents: "none",
            },
            "&::before": {
              left: 0,
              background:
                "linear-gradient(to right, rgba(14,15,18,1), rgba(14,15,18,0))",
            },
            "&::after": {
              right: 0,
              background:
                "linear-gradient(to left, rgba(14,15,18,1), rgba(14,15,18,0))",
            },
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              alignItems: "center",
              // bigger gap on small screens -> feels wider
              gap: { xs: 12, md: 6 },
              px: { xs: 1, md: 0 },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              "&:hover": { animationPlayState: "paused" },
              animationName: "ticker",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              // slower on small so text takes longer to pass → appears wider
              animationDuration: { xs: "28s", md: "20s" },
              "@keyframes ticker": {
                "0%": { transform: "translateX(0)" },
                "100%": { transform: "translateX(-50%)" }, // shift one copy width
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, letterSpacing: 0.2, color: "rgba(55,55,5,.92)" }}
            >
              {msg}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, letterSpacing: 0.2, color: "rgba(55,55,5,.92)" }}
            >
              {msg}
            </Typography>
          </Box>
        </Box>

        {/* RIGHT: user pill (first name only) */}
        {user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: "rgba(205,205,55,.08)",
              border: "0.5px solid rgba(5,5,5,.95)",
              flexShrink: 0,
            }}
            title={firstName(user)}   // <-- first name only
          >
            <Avatar
              sx={{
                width: 22,
                height: 22,
                fontSize: 12,
                bgcolor: "rgba(245,222,179,.25)",
                color: "rgba(5,5,55,.95)",              }}
            >
              {initials(user)}
            </Avatar>
            <Typography
              variant="caption"
              sx={{ color: "rgba(5,5,55,.95)", fontWeight: 700 }}
            >
              {firstName(user)}      {/* <-- first name only */}
            </Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
