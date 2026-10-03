from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.models import Expense, Income
from chelav.finance import totals, money


class ExpenseOverView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        period = {"user": request.user, "date__range": [today.replace(day=1), today]}
        monthly_income = Income.objects.filter(**period).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        monthly_expense = Expense.objects.filter(**period).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        income, expense = totals(request.user)
        balance = income - expense
        return Response({
            "total_income": str(income),
            "total_income_this_month": str(money(monthly_income)),
            "total_expenses": str(expense),
            "total_expenses_this_month": str(money(monthly_expense)),
            "balance": str(balance),
            "due": str(max(-balance, Decimal("0.00"))),
        })
