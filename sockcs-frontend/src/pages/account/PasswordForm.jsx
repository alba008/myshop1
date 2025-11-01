// src/pages/account/PasswordForm.jsx
import { useState } from "react";
import { Stack, TextField, Button, Alert } from "@mui/material";

export default function PasswordForm() {
  const [oldPw, setOldPw] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErr(""); setOk(""); setSaving(true);
    try {
      const r = await fetch("/api/accounts/password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ old_password: oldPw, new_password: pw1, new_password2: pw2 }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.detail || Object.values(data)[0] || "Failed");
      setOk("Password updated.");
      setOldPw(""); setPw1(""); setPw2("");
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      {err && <Alert severity="error">{err}</Alert>}
      {ok && <Alert severity="success">{ok}</Alert>}
      <TextField label="Current password" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
      <TextField label="New password" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
      <TextField label="Confirm new password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <Button onClick={submit} variant="contained" disabled={saving}>
        {saving ? "Updating…" : "Update password"}
      </Button>
    </Stack>
  );
}
