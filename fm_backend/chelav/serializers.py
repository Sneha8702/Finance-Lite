from decimal import Decimal
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.db.models import Q
from rest_framework import serializers
from .models import Category, Expense, Income, AccountEmail


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password2 = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(max_length=254)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate_email(self, value):
        value = value.strip().lower()
        if AccountEmail.objects.filter(email=value).exists() or User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email address is already registered")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError("Passwords do not match")
        try:
            validate_password(attrs["password"], User(username=attrs["username"]))
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(is_active=False, **validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("1"), max_value=Decimal("1000000"))
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=Category.objects.all())
    date = serializers.DateField(default=timezone.localdate)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        self.fields["category_id"].queryset = (
            Category.objects.filter(Q(owner=request.user) | Q(owner__isnull=True))
            if request and request.user.is_authenticated else Category.objects.none()
        )

    class Meta:
        model = Expense
        fields = ["amount", "category_id", "description", "date"]


class IncomeSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("1"), max_value=Decimal("10000000"))
    date = serializers.DateField(input_formats=["%Y-%m-%d", "%d/%m/%Y"])

    class Meta:
        model = Income
        fields = ["amount", "source", "date", "is_recurring", "frequency"]

    def validate(self, attrs):
        if attrs.get("is_recurring") and not attrs.get("frequency"):
            raise serializers.ValidationError({"frequency": "Frequency required for recurring income"})
        if not attrs.get("is_recurring"):
            attrs["frequency"] = None
        return attrs


class ExpenseQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=10, min_value=1, max_value=100)
    category_id = serializers.IntegerField(required=False, min_value=1)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        if attrs.get("start_date") and attrs.get("end_date") and attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError("End date must be on or after start date")
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
        read_only_fields = ["id"]

    def validate_name(self, name):
        name = name.strip()
        user = self.context["request"].user
        if Category.objects.filter(Q(owner=user) | Q(owner__isnull=True), name__iexact=name).exists():
            raise serializers.ValidationError("A category with this name already exists")
        return name
