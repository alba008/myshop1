from rest_framework import serializers
from orders.models import Order, OrderItem
from shop.serializers import ProductSerializer  # or write a tiny nested serializer


class OrderCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=50)
    last_name  = serializers.CharField(max_length=50)
    email      = serializers.EmailField()
    address    = serializers.CharField(max_length=250)
    postal_code= serializers.CharField(max_length=20)
    city       = serializers.CharField(max_length=100)

class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField()
    quantity = serializers.IntegerField()
    unit_price = serializers.FloatField()
    line_total = serializers.FloatField()

class OrderDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    created = serializers.DateTimeField()
    paid = serializers.BooleanField()
    items = OrderItemSerializer(many=True)
    total = serializers.FloatField()

class OrderListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    created = serializers.DateTimeField()
    paid = serializers.BooleanField()
    total = serializers.FloatField()


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "price", "quantity"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source="orderitem_set", many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "first_name", "last_name", "email", "address", "postal_code",
            "city", "paid", "created", "updated", "stripe_id", "discount",
            "coupon", "items",
        ]