from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.serializers import IncomeSerializer


class AddIncomeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = IncomeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid income", "errors": serializer.errors}, status=400)
        income = serializer.save(user=request.user)
        return Response({"message": "Income added successfully", "data": {"id": income.id, **serializer.data}}, status=201)
