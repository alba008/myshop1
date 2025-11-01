// src/pages/Register.jsx
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Typography, Stack,
  Alert, IconButton, InputAdornment, LinearProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import http from "../lib/http";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [pwd,       setPwd]       = useState("");
  const [pwd2,      setPwd2]      = useState("");

  const [showPwd,  setShowPwd]  = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  // tiny strength meter
  const strength = useMemo(() => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return Math.min(s, 5);
  }, [pwd]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    const cleanEmail = (email || "").trim().toLowerCase();
    const username   = cleanEmail.split("@")[0]; // fallback username

    if (!firstName || !lastName || !cleanEmail || !pwd || !pwd2) {
      setErr("Please fill in all fields.");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Register (server expects: username, email, password, password2, first_name, last_name)
      await http.post("/api/accounts/register/", {
        username,
        email: cleanEmail,
        password: pwd,
        password2: pwd2,
        first_name: firstName,
        last_name:  lastName,
      });

      // Auto-login — IMPORTANT: pass object, not positional args
      await login({ email: cleanEmail, password: pwd });

      nav("/account", { replace: true });
    } catch (e2) {
      // Try to surface helpful messages
      const data = e2?.data || {};
      const msg =
        data?.email?.[0] ||
        data?.username?.[0] ||
        data?.password?.[0] ||
        data?.password2?.[0] ||
        data?.detail ||
        e2?.message ||
        "Registration failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
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
          height: 655,
          background: "rgba(20, 20, 25, 0.85)",
          borderRadius: 4,
          border: "1px solid rgba(255, 215, 140, 0.2)",
          boxShadow: "0 0 25px rgba(255, 215, 150, 0.08)",
          backdropFilter: "blur(10px)",
          mb: 30,
        }}
      >
        <CardContent component="form" onSubmit={submit} sx={{ p: { xs: 3, md: 4 } }}>
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
            Create Account
          </Typography>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "rgba(255,255,255,0.65)", mb: 4 }}
          >
            Join our candle community and start your cozy journey ✨
          </Typography>

          {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

          <Stack spacing={3}>
            {/* Names */}
            <TextField
              label="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#f5deb3",
                  boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                },
              }}}
            />
            <TextField
              label="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#f5deb3",
                  boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                },
              }}}
            />

            {/* Email */}
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#f5deb3",
                  boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                },
              }}}
            />

            {/* Password */}
            <TextField
              label="Password"
              type={showPwd ? "text" : "password"}
              required
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{
                style: { color: "white" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPwd((s) => !s)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#f5deb3",
                  boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                },
              }}}
            />

            {/* strength meter */}
            {!!pwd && (
              <Stack spacing={0.5}>
                <LinearProgress
                  variant="determinate"
                  value={(strength / 5) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    "& .MuiLinearProgress-bar": {
                      background:
                        strength < 2 ? "#ef4444" :
                        strength < 3 ? "#f59e0b" : "#22c55e",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  {["Too weak", "Weak", "Okay", "Good", "Strong"][Math.max(strength - 1, 0)]}
                </Typography>
              </Stack>
            )}

            {/* Confirm */}
            <TextField
              label="Confirm Password"
              type={showPwd2 ? "text" : "password"}
              required
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{
                style: { color: "white" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowPwd2((s) => !s)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {showPwd2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#f5deb3",
                  boxShadow: "0 0 10px rgba(255,215,150,0.2)",
                },
              }}}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{
                py: 1.3, fontWeight: 700, fontSize: "1rem", borderRadius: "30px",
                background: "linear-gradient(90deg, #f5deb3, #caa46c, #f5deb3)",
                color: "#121212", boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                "&:hover": {
                  background: "linear-gradient(90deg, #caa46c, #f5deb3, #caa46c)",
                  boxShadow: "0 0 25px rgba(255,215,150,0.4)",
                },
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </Stack>

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: "center", color: "rgba(255,255,255,0.7)" }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#f5deb3", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
