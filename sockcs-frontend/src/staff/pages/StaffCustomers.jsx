// src/staff/pages/StaffCustomers.jsx
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "../api";

export default function StaffCustomers() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", customer_type: "RETAIL", email: "", phone: "", city: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    try {
      const data = await apiGet("/api/admin/customers/");
      setRows(data || []);
    } catch {
      setErr("Failed to load customers.");
    }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name) return;
    setSaving(true);
    try {
      await apiSend("POST", "/api/admin/customers/", form);
      setForm({ name: "", customer_type: "RETAIL", email: "", phone: "", city: "" });
      load();
    } catch {
      setErr("Create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      {err && <div className="rounded-md bg-red-50 text-red-700 p-3">{err}</div>}
      <h1 className="text-xl text-amber-300 font-bold">Customers</h1>

      {/* Quick add */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Select
            label="Type"
            value={form.customer_type}
            onChange={v => setForm(f => ({ ...f, customer_type: v }))}
            options={[{value:"RETAIL",label:"Retail"},{value:"WHOLESALE",label:"Wholesale"}]}
          />
          <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <Field label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
        </div>
        <div className="flex justify-end mt-3">
          <button className="px-3 py-1 rounded bg-amber-300 text-black" onClick={create} disabled={saving}>
            {saving ? "Adding..." : "Add customer"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">City</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map(c => (
              <tr key={c.id} className="text-white/90">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.customer_type}</td>
                <td className="p-2">{c.email || "—"}</td>
                <td className="p-2">{c.phone || "—"}</td>
                <td className="p-2">{c.city || "—"}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-white/60" colSpan={5}>No customers.</td></tr>}
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
        onChange={e => onChange(e.target.value)}
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
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
