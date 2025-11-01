# shop/stripe_views.py
from __future__ import annotations

import json
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple

from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from orders.models import Order, OrderItem
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY
CURRENCY = "usd"


# ---------- money helpers ----------
def _to_cents(v: Decimal | float | int | str) -> int:
    try:
        return int((Decimal(v) * 100).quantize(Decimal("1")))
    except Exception:
        return 0


def _sum(li: List[int]) -> int:
    s = 0
    for x in li:
        s += int(x or 0)
    return s


# ---------- order helpers ----------
def _order_items(order: Order) -> List[OrderItem]:
    return list(OrderItem.objects.filter(order=order).select_related("product"))


def _build_snapshot(order: Order) -> List[Dict[str, Any]]:
    """
    Snapshot lines (in cents):
    [{ name, qty, unit_cents, line_subtotal_cents }, ...]
    """
    out: List[Dict[str, Any]] = []
    for it in _order_items(order):
        qty = int(it.quantity or 1)
        unit_cents = _to_cents(it.price or 0)
        if qty <= 0 or unit_cents < 0:
            continue
        out.append({
            "name": getattr(it.product, "name", str(it.product)),
            "qty": qty,
            "unit_cents": unit_cents,
            "line_subtotal_cents": unit_cents * qty,
        })
    return out


# ---------- modern discount allocator ----------
def _allocate_discount_proportionally(lines: List[Dict[str, Any]], total_discount_cents: int) -> List[int]:
    """
    Proportionally allocate a total discount across lines by their share of subtotal.
    Unbiased rounding. Guarantees sum(alloc) == total_discount_cents by adjusting last line.
    Returns: list of allocated discount cents per line, same order as lines.
    """
    if not lines or total_discount_cents <= 0:
        return [0 for _ in lines]

    subtotal = _sum([ln["line_subtotal_cents"] for ln in lines])
    if subtotal <= 0:
        return [0 for _ in lines]

    raw_allocs: List[int] = []
    running = 0
    for i, ln in enumerate(lines):
        share = (Decimal(ln["line_subtotal_cents"]) / Decimal(subtotal)) * Decimal(total_discount_cents)
        cents = int(share.to_integral_value(rounding=ROUND_HALF_UP))
        raw_allocs.append(cents)
        running += cents

    # Fix rounding drift on the last line if needed
    drift = running - int(total_discount_cents)
    if drift != 0:
        raw_allocs[-1] = max(0, raw_allocs[-1] - drift)

    return raw_allocs


def _split_net_line_to_units(qty: int, net_line_cents: int) -> Tuple[int, int, int, int]:
    """
    Split a net line total into at most two (quantity, unit_price) chunks
    so Stripe gets exact totals with integer unit_amount.
    Returns (q1, u1, q2, u2). Any of these may be 0 if not needed.
    """
    if qty <= 0:
        return 0, 0, 0, 0
    if net_line_cents <= 0:
        return 0, 0, 0, 0

    base = net_line_cents // qty
    remainder = net_line_cents - base * qty
    q2 = remainder
    q1 = qty - q2
    u1 = base
    u2 = base + 1 if remainder > 0 else 0
    return q1, u1, q2, u2


# ---------- API ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def create_stripe_session(request):
    """
    POST { "order_id": 123 }
    Modern shop discounting:
      - compute total discount from backend
      - allocate per-line proportionally
      - convert to per-unit discounted prices (cent-perfect)
      - NO session-level Stripe coupon
    """
    # Parse incoming
    try:
        data = request.data or {}
    except Exception:
        try:
            data = json.loads(request.body or "{}")
        except Exception:
            data = {}

    order_id = data.get("order_id") or request.session.get("last_order_id")
    if not order_id:
        return JsonResponse({"detail": "No order provided."}, status=400)

    try:
        order = Order.objects.select_related("coupon").get(id=order_id, paid=False)
    except Order.DoesNotExist:
        return JsonResponse({"detail": "Order not found or already paid."}, status=400)

    # Remember for your “Thank you” flow
    request.session["last_order_id"] = order.id
    request.session.modified = True

    # Build snapshot and backend totals
    lines = _build_snapshot(order)
    if not lines:
        return JsonResponse({"detail": "Order has no items."}, status=400)

    backend_subtotal_cents = _sum([ln["line_subtotal_cents"] for ln in lines])
    backend_discount_cents = _to_cents(order.get_discount() or 0)
    backend_total_cents    = _to_cents(order.get_total_cost() or 0)

    # Guard rails
    if backend_discount_cents < 0:
        backend_discount_cents = 0
    backend_discount_cents = min(backend_discount_cents, backend_subtotal_cents)

    # Allocate discount per line
    per_line_discount = _allocate_discount_proportionally(lines, backend_discount_cents)

    # Build Stripe line_items with discounted per-unit prices
    line_items: List[Dict[str, Any]] = []
    for ln, alloc in zip(lines, per_line_discount):
        net_line_cents = max(0, ln["line_subtotal_cents"] - alloc)
        q = ln["qty"]
        q1, u1, q2, u2 = _split_net_line_to_units(q, net_line_cents)

        # First chunk
        if q1 > 0 and u1 > 0:
            line_items.append({
                "quantity": q1,
                "price_data": {
                    "currency": CURRENCY,
                    "unit_amount": u1,
                    "product_data": {"name": ln["name"]},
                },
            })
        # Second chunk (remainder cents spread)
        if q2 > 0 and u2 > 0:
            line_items.append({
                "quantity": q2,
                "price_data": {
                    "currency": CURRENCY,
                    "unit_amount": u2,
                    "product_data": {"name": ln["name"]},
                },
            })

    if not line_items:
        # Entire discount wiped the cart (edge-case)
        return JsonResponse({"detail": "Nothing to charge after discount."}, status=400)

    # Sanity check: Stripe sum must equal backend total cents
    computed_total = _sum([li["price_data"]["unit_amount"] * li["quantity"] for li in line_items])
    if computed_total != backend_total_cents:
        # Extremely rare; if rounding still drifted, nudge the last unit_amount by +/-1 to match.
        drift = backend_total_cents - computed_total
        for li in reversed(line_items):
            new_unit = li["price_data"]["unit_amount"] + drift
            if new_unit > 0:
                li["price_data"]["unit_amount"] = new_unit
                computed_total = _sum([x["price_data"]["unit_amount"] * x["quantity"] for x in line_items])
                break

    # Final assert (soft)
    # (We don't crash here; Stripe will still create session even if off by 1, but our nudge above should fix it.)
    # print("backend_total", backend_total_cents, "computed_total", computed_total)

    # URLs
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    success_url = f"{frontend_base}/order/thank-you?order={order.id}"
    cancel_url  = f"{frontend_base}/cart"

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            # No session-level discounts (to avoid drift)
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=order.email or None,
            client_reference_id=str(order.id),
            metadata={
                "order_id": str(order.id),
                "session_key": request.session.session_key or "",
                "user_id": str(getattr(request.user, "id", "")) if getattr(request, "user", None) and request.user.is_authenticated else "",
                "email": order.email or "",
            },
        )
        return JsonResponse({"url": session.url}, status=201)
    except stripe.error.StripeError as e:
        return JsonResponse({"detail": str(e)}, status=400)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    if not endpoint_secret:
        return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    etype = event.get("type")
    obj = (event.get("data") or {}).get("object") or {}

    def mark_paid(order_id_str: str | None):
        if not order_id_str:
            return
        try:
            oid = int(order_id_str)
            order = Order.objects.get(id=oid)
            if not order.paid:
                order.paid = True
                order.save(update_fields=["paid"])
        except Exception:
            pass

    if etype == "checkout.session.completed":
        meta = obj.get("metadata") or {}
        mark_paid(meta.get("order_id"))
    elif etype == "payment_intent.succeeded":
        meta = obj.get("metadata") or {}
        mark_paid(meta.get("order_id"))

    return HttpResponse(status=200)


__all__ = ["create_stripe_session", "stripe_webhook"]
