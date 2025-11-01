// src/staff/pages/StaffProducts.jsx
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "../api";

export default function StaffProducts() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    try {
      const data = await apiGet("/api/admin/products/");
      setRows(data || []);
    } catch {
      setErr("Failed to load products.");
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit) return;
    setSaving(true);
    try {
      await apiSend("PUT", `/api/admin/products/${edit.id}/`, edit);
      setEdit(null);
      load();
    } catch {
      setErr("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {err && <div className="rounded-md bg-red-50 text-red-700 p-3">{err}</div>}
      <h1 className="text-xl text-amber-300 font-bold">Products</h1>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Retail</th>
              <th className="text-left p-2">Wholesale</th>
              <th className="text-left p-2">Track</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map(r => (
              <tr key={r.id} className="text-white/90">
                <td className="p-2">{r.sku || "—"}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">${Number(r.price_retail || 0).toFixed(2)}</td>
                <td className="p-2">${Number(r.price_wholesale || 0).toFixed(2)}</td>
                <td className="p-2">{r.track_stock ? "Yes" : "No"}</td>
                <td className="p-2">{r.is_active ? "Yes" : "No"}</td>
                <td className="p-2 text-right">
                  <button
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => setEdit(r)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td className="p-4 text-white/60" colSpan={7}>No products.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Drawer (simple modal) */}
      {edit && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-4 space-y-3">
            <div className="text-white font-semibold">Edit product</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={edit.name} onChange={v => setEdit(e => ({ ...e, name: v }))} />
              <Field label="SKU" value={edit.sku || ""} onChange={v => setEdit(e => ({ ...e, sku: v }))} />
              <Field label="Retail" type="number" value={edit.price_retail} onChange={v => setEdit(e => ({ ...e, price_retail: v }))} />
              <Field label="Wholesale" type="number" value={edit.price_wholesale} onChange={v => setEdit(e => ({ ...e, price_wholesale: v }))} />
              <Toggle label="Track stock" checked={!!edit.track_stock} onChange={v => setEdit(e => ({ ...e, track_stock: v }))} />
              <Toggle label="Active" checked={!!edit.is_active} onChange={v => setEdit(e => ({ ...e, is_active: v }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded bg-white/10" onClick={() => setEdit(null)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-amber-300 text-black" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-white/70 mb-1">{label}</span>
      <input
        className="rounded bg-zinc-800 border border-white/10 text-white px-2 py-1"
        value={value ?? ""}
        type={type}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-white/80">{label}</span>
    </label>
  );
}
