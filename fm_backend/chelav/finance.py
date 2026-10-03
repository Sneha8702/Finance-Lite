from decimal import Decimal
from django.db.models import Sum
from .models import Expense, Income


def money(value):
    return Decimal(value or 0).quantize(Decimal("0.01"))


def totals(user):
    income = Income.objects.filter(user=user).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    expense = Expense.objects.filter(user=user).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    return money(income), money(expense)
