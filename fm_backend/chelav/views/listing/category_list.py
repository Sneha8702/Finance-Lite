from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.models import Category
from chelav.serializers import CategorySerializer


class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(Q(owner=request.user) | Q(owner__isnull=True)).order_by("name", "id")
        return Response({"status": "success", "categories": CategorySerializer(categories, many=True).data})

    def post(self, request):
        serializer = CategorySerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response({"error": " ".join(serializer.errors.get("name", ["Invalid category"])), "errors": serializer.errors}, status=400)
        try:
            with transaction.atomic():
                category = serializer.save(owner=request.user)
        except IntegrityError:
            return Response({"error": "A category with this name already exists"}, status=400)
        return Response({"status": "success", "category": CategorySerializer(category).data}, status=201)
