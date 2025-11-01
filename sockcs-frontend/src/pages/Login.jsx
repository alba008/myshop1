import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  Snackbar,
  Slide,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { AlignCenter } from "lucide-react";

// Slide transition for snackbar
function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export default function Login() {
  const nav = useNavigate();
  const location = useLocation(); // grab location
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Safely get the page user came from
  const rawFrom = location.state?.from;
   const from =
   typeof rawFrom === "string"
     ? rawFrom
     : rawFrom
     ? `${rawFrom.pathname || "/"}${rawFrom.search || ""}${rawFrom.hash || ""}`
     : "/";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login({ email, password });
      nav(from && from !== "/login" ? from : "/account", { replace: true });
       } catch (e2) {
      const message =
        e2?.response?.data?.detail ||
        e2?.message ||
        "Login failed. Please check your credentials.";
      setErr(message);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #0b0b0e, #1c1917, #2a2523)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(20, 20, 25, 0.85)",
          borderRadius: 4,
          border: "1px solid rgba(255, 215, 140, 0.2)",
          boxShadow: "0 0 25px rgba(255, 215, 150, 0.08)",
          backdropFilter: "blur(10px)",
          mb: 30,
        
        }}
      >
        <CardContent component="form" onSubmit={submit} sx={{ p: 4 }}>
          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              mb: 2,
              color: "#f5deb3",
              textAlign: "center",
              textShadow: "0 0 15px rgba(255, 215, 150, 0.2)",
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "rgba(255,255,255,0.65)",
              mb: 4,
            }}
          >
            Sign in to continue your candle journey ✨
          </Typography>

          {/* Modern Error Snackbar */}
          <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={handleClose}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleClose}
              severity="error"
              sx={{
                width: "100%",
                maxWidth: 400,
                borderRadius: 3,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                fontWeight: 500,
                fontSize: "0.95rem",
                background: "linear-gradient(90deg, #ff6b6b, #ff3d3d)",
                color: "white",
                textAlign: "center",
              }}
            >
              {err}
            </Alert>
          </Snackbar>

          {/* Inputs */}
          <Stack spacing={3}>
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{
                style: { color: "white" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#f5deb3",
                    boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                  },
                },
              }}
            />

            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{
                style: { color: "white" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#f5deb3",
                    boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                  },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{
                py: 1.3,
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "30px",
                background:
                  "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                color: "#121212",
                boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
                  boxShadow: "0 0 25px rgba(255,215,150,0.4)",
                },
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>

          {/* Footer */}
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              textAlign: "center",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            No account?{" "}
            <Link
              to="/register"
              style={{
                color: "#f5deb3",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create one
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
