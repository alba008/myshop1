// src/staff/pages/StaffInventory.jsx
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "../api";

export default function StaffInventory() {
  const [snapshot, setSnapshot] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product: "", delta: 0, reason: "ADJUSTMENT", note: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    try {
      const [snap, prods] = await Promise.all([
        apiGet("/api/admin/stock/snapshot/"),
        apiGet("/api/admin/products/"),
      ]);
      setSnapshot(snap || []);
      setProducts(prods || []);
    } catch {
      setErr("Failed to load inventory.");
    }
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.product || !form.delta) return;
    setSaving(true);
    try {
      await apiSend("POST", "/api/admin/stock/", { ...form, delta: Number(form.delta) });
      setForm({ product: "", delta: 0, reason: "ADJUSTMENT", note: "" });
      load();
    } catch {
      setErr("Adjustment failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      {err && <div className="rounded-md bg-red-50 text-red-700 p-3">{err}</div>}
      <h1 className="text-xl text-amber-300 font-bold">Inventory</h1>

      {/* Quick adjust */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="Product"
            value={form.product}
            onChange={(v) => setForm(f => ({ ...f, product: v }))}
            options={products.map(p => ({ value: p.id, label: p.name }))}
          />
          <Field label="Delta (+/-)" type="number" value={form.delta} onChange={v => setForm(f => ({ ...f, delta: v }))} />
          <Select
            label="Reason"
            value={form.reason}
            onChange={(v) => setForm(f => ({ ...f, reason: v }))}
            options={["PRODUCTION","SALE","ADJUSTMENT","DAMAGED","RETURNED"].map(r => ({ value: r, label: r }))}
          />
          <Field label="Note" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} />
        </div>
        <div className="flex justify-end">
          <button className="px-3 py-1 rounded bg-amber-300 text-black" onClick={submit} disabled={saving}>
            {saving ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Snapshot table */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Product</th>
              <th className="text-right p-2">On hand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {snapshot.map(r => (
              <tr key={r.product_id} className="text-white/90">
                <td className="p-2">{r.sku || "—"}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2 text-right">{r.on_hand}</td>
              </tr>
            ))}
            {!snapshot.length && (
              <tr><td className="p-4 text-white/60" colSpan={3}>No stock.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text" }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-white/70 mb-1">{label}</span>
      <input
        className="rounded bg-zinc-800 border border-white/10 text-white px-2 py-1"
        value={value ?? ""}
        type={type}
        onChange={e => onChange(type==="number" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}
function Select({ label, value, onChange, options=[] }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-white/70 mb-1">{label}</span>
      <select
        className="rounded bg-zinc-800 border border-white/10 text-white px-2 py-1"
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
