from calendar import monthrange
from datetime import date, timedelta
from django.db.models import Sum
from django.db.models.functions import ExtractMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.models import Expense, Income
from chelav.finance import money


class UserExpenseAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mode = request.query_params.get("mode", "monthly")
        kind = request.query_params.get("type", "expense")
        if mode not in {"daily", "monthly", "yearly"} or kind not in {"expense", "income"}:
            return Response({"error": "Invalid analytics mode or type"}, status=400)
        records = (Income if kind == "income" else Expense).objects.filter(user=request.user)
        today = timezone.localdate()
        if mode == "yearly":
            rows = records.filter(date__year=today.year).annotate(month=ExtractMonth("date")).values("month").annotate(total=Sum("amount"))
            amounts = {row["month"]: row["total"] for row in rows}
            data = [{"month": m, "amount": str(money(amounts.get(m)))} for m in range(1, 13)]
        else:
            try:
                if mode == "monthly":
                    start = today.replace(day=1)
                    end = today.replace(day=monthrange(today.year, today.month)[1])
                elif request.query_params.get("date"):
                    start = end = date.fromisoformat(request.query_params["date"])
                elif request.query_params.get("start_date") or request.query_params.get("end_date"):
                    start = date.fromisoformat(request.query_params["start_date"])
                    end = date.fromisoformat(request.query_params["end_date"])
                else:
                    start = end = today
            except (ValueError, KeyError):
                return Response({"error": "Provide valid YYYY-MM-DD dates; ranges require both dates"}, status=400)
            if end < start or (end - start).days > 366:
                return Response({"error": "Date range must be ordered and at most 367 days"}, status=400)
            rows = records.filter(date__range=[start, end]).values("date").annotate(total=Sum("amount"))
            amounts = {row["date"]: row["total"] for row in rows}
            data = []
            current = start
            while current <= end:
                data.append({"date": current.isoformat(), "amount": str(money(amounts.get(current)))})
                current += timedelta(days=1)
        return Response({"mode": mode, "type": kind, "data": data})
