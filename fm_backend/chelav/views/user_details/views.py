from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from chelav.models import AccountEmail


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        account = AccountEmail.objects.filter(user=user).first()
        return Response({"id": user.id, "username": user.username,
                         "email": user.email, "email_verified": bool(account and account.verified_at)})


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "delete_account"

    def delete(self, request):
        password = request.data.get("password")
        if not isinstance(password, str) or not password:
            return Response({"error": "Enter your current password"}, status=400)
        if request.data.get("confirm") is not True:
            return Response({"error": "Confirm permanent account deletion"}, status=400)
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            if not user.check_password(password):
                return Response({"error": "Incorrect password"}, status=400)
            # Remove stored refresh tokens instead of leaving orphaned token records.
            OutstandingToken.objects.filter(user=user).delete()
            user.delete()
        return Response(status=204)
