# myshop/orders/views_public.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import F, Value, CharField
from django.db.models.functions import Coalesce, Cast
from decimal import Decimal

@require_GET
def last_order(request):
    oid = request.session.get("last_order_id")
    if not oid:
        return JsonResponse({"detail": "No recent order"}, status=404)

    from .models import Order, OrderItem

    try:
        order = Order.objects.get(pk=oid)
    except Order.DoesNotExist:
        return JsonResponse({"detail": "Order not found"}, status=404)

    # NOTE: Cast both sides to a common text type and set output_field=CharField
    items_qs = (
        OrderItem.objects
        .filter(order_id=order.id)
        .select_related("product")
        .annotate(
            name=F("product__name"),
            product_image=Coalesce(
                Cast(F("product__image_url"), CharField()),
                Cast(F("product__image"), CharField()),
                Value(None, output_field=CharField()),
                output_field=CharField(),   # <- fixes mixed-type FieldError
            ),
        )
        .values("product_id", "name", "price", "quantity", "product_image")
    )

    items = list(items_qs)

    def D(x):  # safe Decimal
        try: return Decimal(str(x))
        except: return Decimal("0")

    subtotal = Decimal("0")
    for it in items:
        price = D(it.get("price"))
        qty = D(it.get("quantity") or 0)
        line_total = price * qty
        it["price"] = str(price)
        it["quantity"] = int(qty) if qty == int(qty) else float(qty)
        it["line_total"] = str(line_total)
        # Normalize to string/None for JSON simplicity
        it["product_image"] = (it.get("product_image") or None)
        subtotal += line_total

    discount = D(getattr(order, "discount", 0))
    total = D(getattr(order, "total", 0)) or max(Decimal("0"), subtotal - discount)

    payload = {
        "id": order.id,
        "paid": getattr(order, "paid", None),
        "subtotal": str(getattr(order, "subtotal", subtotal) or subtotal),
        "discount": str(discount),
        "total": str(total),
        "items": items,
        "created": getattr(order, "created", None).isoformat() if getattr(order, "created", None) else None,
        "updated": getattr(order, "updated", None).isoformat() if getattr(order, "updated", None) else None,
    }

    if request.GET.get("full") in {"1", "true", "yes"}:
        payload.update({
            "first_name": getattr(order, "first_name", None),
            "last_name": getattr(order, "last_name", None),
            "email": getattr(order, "email", None),
            "address": getattr(order, "address", None),
            "postal_code": getattr(order, "postal_code", None),
            "city": getattr(order, "city", None),
        })


    return JsonResponse(payload, status=200)
