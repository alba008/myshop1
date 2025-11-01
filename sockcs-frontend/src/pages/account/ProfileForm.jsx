import { useEffect, useState, useMemo } from "react";
import {
  Stack, TextField, Button, Avatar, Typography, Alert, Box, LinearProgress,
  Card, CardContent, Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";

/* --- Theme tokens --- */
const GOLD = "#f5deb3";
const GOLD_BORDER = "rgba(245,222,179,.35)";
const FRAME_BG = "rgba(255,255,255,.06)";
const FRAME_BORDER = "rgba(255,255,255,.10)";
const TEXT_MAIN = "rgba(255,255,255,.96)";
const TEXT_MID = "rgba(255,255,255,.78)";

/* --- helpers: pick token (if you’re storing it) --- */
function getAccessToken() {
  // Try common keys you might be using
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("jwt_access") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function authFetch(url, opts = {}) {
  const access = getAccessToken();
  const headers = new Headers(opts.headers || {});
  if (access) headers.set("Authorization", `Bearer ${access}`);
  // Only set Content-Type for JSON requests; FormData sets its own
  const isJSON = opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type");
  if (isJSON) headers.set("Content-Type", "application/json");

  const res = await fetch(url, {
    credentials: "include", // keep session cookie path too
    ...opts,
    headers,
  });

  // If unauthorized, push caller to handle; most likely redirect to login
  return res;
}

export default function ProfileForm({ me = {}, onMeUpdated }) {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState(me?.first_name || "");
  const [lastName,  setLastName]  = useState(me?.last_name  || "");
  const [email,     setEmail]     = useState(me?.email      || "");

  const [phone,     setPhone]     = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [file,      setFile]      = useState(null);

  const [err,       setErr]       = useState("");
  const [ok,        setOk]        = useState("");
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  // Hydrate profile extras (phone, avatar)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await authFetch("/api/accounts/profile/");
        if (r.status === 401) return nav("/login", { replace: true });
        const d = r.ok ? await r.json() : null;
        if (!alive) return;
        setPhone(d?.phone || "");
        setAvatarUrl(d?.avatar_url || null);
      } catch (e) {
        if (alive) setErr("Failed to load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview and basic filesize guard (3MB)
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) {
      setErr("Please choose an image under 3MB.");
      return;
    }
    setFile(f);
    setAvatarUrl(URL.createObjectURL(f));
  };

  const canSave = useMemo(() => {
    return (firstName || lastName || phone || file) && !saving;
  }, [firstName, lastName, phone, file, saving]);

  const save = async () => {
    setErr(""); setOk(""); setSaving(true);
    try {
      // 1) Update names via /me (JSON)
      const r1 = await authFetch("/api/accounts/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: (firstName || "").trim(),
          last_name: (lastName || "").trim(),
        }),
      });
      if (r1.status === 401) return nav("/login", { replace: true });
      if (!r1.ok) {
        const data = await r1.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to update name.");
      }
      const newMe = await r1.json();
      onMeUpdated?.(newMe);

      // 2) Update profile (phone + avatar) via multipart
      const fd = new FormData();
      fd.append("phone", phone || "");
      if (file) fd.append("avatar", file);

      const r2 = await authFetch("/api/accounts/profile/", {
        method: "PATCH",
        body: fd,
      });
      if (r2.status === 401) return nav("/login", { replace: true });
      if (!r2.ok) {
        const data = await r2.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to update profile.");
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
    <Card
      variant="outlined"
      sx={{
        background: FRAME_BG,
        borderColor: FRAME_BORDER,
        color: TEXT_MAIN,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: GOLD, mb: 1 }}>
          Profile
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MID, mb: 2 }}>
          Update your personal info and photo. Changes reflect across your account immediately.
        </Typography>

        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {ok  && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

        <Stack spacing={2.25}>
          {/* Avatar row */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                position: "relative",
                width: 82, height: 82, borderRadius: "50%",
                p: 0.5,
                background: "linear-gradient(90deg, rgba(245,222,179,.9), rgba(202,164,108,.9), rgba(245,222,179,.9))",
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
            <div>
              <Button variant="outlined" component="label" sx={{ mr: 1, borderColor: GOLD_BORDER, color: GOLD }}>
                Change photo
                <input type="file" accept="image/*" hidden onChange={onPick} />
              </Button>
              {avatarUrl && (
                <Typography variant="caption" sx={{ color: TEXT_MID, display: "block" }}>
                  Preview • will upload on Save
                </Typography>
              )}
            </div>
          </Stack>

          <Divider sx={{ borderColor: GOLD_BORDER }} />

          {/* Names & contact */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: GOLD_BORDER },
                "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 8px rgba(245,222,179,.25)" },
              }}}
            />
            <TextField
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
              InputProps={{ style: { color: "white" } }}
              sx={{ "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: GOLD_BORDER },
                "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 8px rgba(245,222,179,.25)" },
              }}}
            />
          </Stack>

          <TextField
            label="Email"
            value={email}
            disabled
            fullWidth
            InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
            InputProps={{ style: { color: "white" } }}
            sx={{ "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: GOLD_BORDER },
              "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 8px rgba(245,222,179,.25)" },
            }}}
          />

          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
            InputProps={{ style: { color: "white" } }}
            sx={{ "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: GOLD_BORDER },
              "&.Mui-focused fieldset": { borderColor: GOLD, boxShadow: "0 0 8px rgba(245,222,179,.25)" },
            }}}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disabled={!canSave}
              onClick={save}
              sx={{
                borderRadius: "999px",
                px: 3,
                fontWeight: 900,
                background: "linear-gradient(90deg, rgba(245,222,179,.95), rgba(202,164,108,.95), rgba(245,222,179,.95))",
                color: "#121212",
                boxShadow: "0 0 18px rgba(255,215,150,.25)",
                "&:hover": {
                  background: "linear-gradient(90deg, rgba(202,164,108,1), rgba(245,222,179,1), rgba(202,164,108,1))",
                },
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
