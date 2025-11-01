// src/pages/Account.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, TextField, Button,
  Avatar, Alert, LinearProgress, InputAdornment, Divider
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import authFetch from "../lib/authFetch";

/* ---- Theme tokens (match Login) ---- */
const GOLD = "#f5deb3";
const GOLD_BORDER = "rgba(245,222,179,.35)";
const PAGE_BG = "linear-gradient(to bottom right, #0b0b0e, #1c1917, #2a2523)";
const FRAME_BG = "rgba(20, 20, 25, 0.85)";
const FRAME_BORDER = "1px solid rgba(255, 215, 140, 0.2)";
const TEXT_MID = "rgba(255,255,255,0.65)";

/* ---- Page ---- */
export default function Account() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName,  setLastName]  = useState(user?.last_name  || "");
  const [email,     setEmail]     = useState(user?.email      || "");

  const [phone,     setPhone]     = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [file,      setFile]      = useState(null);

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");
  const [ok,        setOk]        = useState("");

  // Hydrate /me (names,email) and /profile (phone,avatar) with GET
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // /me
        const rMe = await authFetch("/api/accounts/me/", { method: "GET" });
        if (rMe.status === 401) return nav("/login", { replace: true });
        if (rMe.ok) {
          const d = await rMe.json();
          if (!alive) return;
          setFirstName(d?.first_name || "");
          setLastName(d?.last_name || "");
          setEmail(d?.email || "");
          setUser?.(d);
        }

        // /profile
        const rP = await authFetch("/api/accounts/profile/", { method: "GET" });
        if (rP.status === 401) return nav("/login", { replace: true });
        if (rP.ok) {
          const p = await rP.json();
          if (!alive) return;
          setPhone(p?.phone || "");
          setAvatarUrl(p?.avatar_url || null);
        }
      } catch {
        if (alive) setErr("Failed to load your profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { setErr("Please choose an image under 3MB."); return; }
    setFile(f);
    setAvatarUrl(URL.createObjectURL(f));
  };

  const canSave = useMemo(() => (firstName || lastName || phone || file) && !saving, [firstName, lastName, phone, file, saving]);

  const save = async () => {
    setErr(""); setOk(""); setSaving(true);
    try {
      // 1) names -> /me (PATCH JSON)
      const r1 = await authFetch("/api/accounts/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: (firstName || "").trim(),
          last_name:  (lastName  || "").trim(),
        }),
      });
      if (r1.status === 401) return nav("/login", { replace: true });
      if (!r1.ok) {
        const d = await r1.json().catch(() => ({}));
        throw new Error(d?.detail || "Could not update your name.");
      }
      const newMe = await r1.json();
      setUser?.(newMe);

      // 2) phone + avatar -> /profile (PATCH multipart)
      const fd = new FormData();
      fd.append("phone", phone || "");
      if (file) fd.append("avatar", file);
      const r2 = await authFetch("/api/accounts/profile/", {
        method: "PATCH",
        body: fd,
      });
      if (r2.status === 401) return nav("/login", { replace: true });
      if (!r2.ok) {
        const d = await r2.json().catch(() => ({}));
        throw new Error(d?.detail || "Could not update your profile.");
      }

      setOk("Profile updated.");
      setFile(null);
    } catch (e) {
      setErr(e.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: PAGE_BG,
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
          maxWidth: 640,
          background: FRAME_BG,
          borderRadius: 4,
          border: FRAME_BORDER,
          boxShadow: "0 0 25px rgba(255, 215, 150, 0.08)",
          backdropFilter: "blur(10px)",
          mb: 30,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              mb: 1.5,
              color: GOLD,
              textAlign: "center",
              textShadow: "0 0 15px rgba(255, 215, 150, 0.2)",
            }}
          >
            Your Profile
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "center", color: TEXT_MID, mb: 3 }}>
            Update your personal details and photo. Changes apply instantly ✨
          </Typography>

          {loading && <Box sx={{ mb: 2 }}><LinearProgress /></Box>}
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          {ok  && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

          <Stack spacing={3}>
            {/* Avatar + Upload */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <Box
                sx={{
                  position: "relative",
                  width: 96, height: 96, borderRadius: "50%",
                  p: 0.6,
                  background: "linear-gradient(90deg, rgba(245,222,179,.95), rgba(202,164,108,.95), rgba(245,222,179,.95))",
                }}
              >
                <Avatar
                  src={avatarUrl || undefined}
                  alt="Avatar"
                  sx={{
                    width: "100%", height: "100%",
                    border: `2px solid ${GOLD_BORDER}`,
                    bgcolor: "rgba(255,255,255,.08)",
                  }}
                  imgProps={{ onError: (e) => (e.currentTarget.src = "/media/placeholder.png") }}
                />
              </Box>

              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{ borderColor: GOLD_BORDER, color: GOLD, "&:hover": { borderColor: GOLD, color: "#fff" } }}
              >
                Change Photo
                <input type="file" accept="image/*" hidden onChange={onPick} />
              </Button>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

            {/* Names */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
                InputProps={{ style: { color: "white" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(255,215,150,0.2)" },
                  },
                }}
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
                InputProps={{ style: { color: "white" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(255,215,150,0.2)" },
                  },
                }}
              />
            </Stack>

            {/* Email (locked) */}
            <TextField
              label="Email"
              value={email}
              disabled
              fullWidth
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(255,215,150,0.2)" },
                },
              }}
            />

            {/* Phone */}
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              InputProps={{
                style: { color: "white" },
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ color: TEXT_MID, fontSize: 12 }}>+ / 0</Typography>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,215,150,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 10px rgba(255,215,150,0.2)" },
                },
              }}
            />

            {/* Actions */}
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button
                variant="contained"
                disabled={!canSave}
                onClick={save}
                sx={{
                  py: 1.1,
                  px: 3,
                  fontWeight: 700,
                  borderRadius: "30px",
                  background: "linear-gradient(90deg, rgba(245,222,179,.95), rgba(202,164,108,.95), rgba(245,222,179,.95))",
                  color: "#121212",
                  boxShadow: "0 0 20px rgba(255,215,150,0.25)",
                  "&:hover": {
                    background: "linear-gradient(90deg, rgba(202,164,108,1), rgba(245,222,179,1), rgba(202,164,108,1))",
                    boxShadow: "0 0 25px rgba(255,215,150,0.4)",
                  },
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
