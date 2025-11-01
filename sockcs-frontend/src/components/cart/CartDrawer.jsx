import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import api from "../../lib/http";     // or: import { api } from "../../lib/http";

export default function CartDrawer({ open, onClose }) {
  const [cart, setCart] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const data = await api("/api/cart/", { credentials: "include" });
      setCart(data);
    } catch (e) {
      setErr(e.message || "Failed to load cart");
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const updateQty = async (product_id, quantity) => {
    await api("/api/cart/item/", {
      method: "PATCH",
      body: JSON.stringify({ product_id, quantity }),
      credentials: "include",
    });
    load();
  };

  const removeItem = async (product_id) => {
    await api("/api/cart/item/", {
      method: "DELETE",
      body: JSON.stringify({ product_id }),
      credentials: "include",
    });
    load();
  };

  const clear = async () => {
    await api("/api/cart/", { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 inset-y-0 z-50 w-[92%] sm:w-[480px] bg-[#0b0b0c] border-l border-white/10 transform transition ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white text-lg font-semibold">Your Cart</h3>
          <button onClick={onClose} className="text-white/90 p-2 rounded hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(100vh-160px)]">
          {err && <div className="text-rose-300 text-sm mb-3">{err}</div>}
          {!cart ? (
            <div className="text-white/70">Loading…</div>
          ) : cart.items.length === 0 ? (
            <div className="text-white/70">Your cart is empty.</div>
          ) : (
            <ul className="space-y-3">
              {cart.items.map((i, idx) => (
                <li key={idx} className="flex gap-3 rounded-xl border border-white/10 p-3">
                  <img src={i.image} alt={i.name} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="text-white font-medium">{i.name}</div>
                    <div className="text-white/70 text-sm">${i.price}</div>
                    <div className="mt-2 inline-flex items-center gap-2">
                      <button onClick={() => updateQty(i.product_id, Math.max(1, i.quantity - 1))} className="p-1 rounded border border-white/10 hover:bg-white/10">
                        <Minus size={16} />
                      </button>
                      <span className="text-white">{i.quantity}</span>
                      <button onClick={() => updateQty(i.product_id, i.quantity + 1)} className="p-1 rounded border border-white/10 hover:bg-white/10">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeItem(i.product_id)} className="p-1 rounded border border-white/10 hover:bg-white/10 text-rose-300 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-white font-mono">${i.line_total}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-white mb-3">
            <span>Subtotal</span>
            <span className="font-semibold">${cart?.subtotal ?? "0.00"}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clear} className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10">
              Clear
            </button>
            <a
              href="/checkout"
              className="flex-1 text-center rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-slate-100"
            >
              Checkout
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
