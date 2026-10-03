from django.core.paginator import Paginator, EmptyPage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.models import Expense
from chelav.serializers import ExpenseSerializer, ExpenseQuerySerializer
from chelav.finance import totals


class AddExpenseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response({"error": "Invalid expense", "errors": serializer.errors}, status=400)
        expense = serializer.save(user=request.user)
        income, spent = totals(request.user)
        balance = income - spent
        data = {"status": "success", "message": "Expense added successfully",
                "expense_id": expense.id, "current_balance": str(balance)}
        if balance < 0:
            data["warning"] = f"You are exceeding your balance by Rs. {-balance:.2f}"
        return Response(data, status=201)


class UserExpensesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = ExpenseQuerySerializer(data=request.query_params)
        if not query.is_valid():
            return Response({"error": "Invalid expense filters", "errors": query.errors}, status=400)
        params = query.validated_data
        expenses = Expense.objects.filter(user=request.user)
        if params.get("category_id"):
            expenses = expenses.filter(category_id=params["category_id"])
        if params.get("start_date"):
            expenses = expenses.filter(date__gte=params["start_date"])
        if params.get("end_date"):
            expenses = expenses.filter(date__lte=params["end_date"])
        expenses = expenses.select_related("category").order_by("-date", "-id")
        paginator = Paginator(expenses, params["page_size"])
        try:
            records = paginator.page(params["page"])
        except EmptyPage:
            records = []
        return Response({
            "results": [{"id": row.id, "amount": str(row.amount),
                         "category": row.category.name if row.category else None,
                         "description": row.description, "date": row.date} for row in records],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": params["page"],
            "page_size": params["page_size"],
        })
