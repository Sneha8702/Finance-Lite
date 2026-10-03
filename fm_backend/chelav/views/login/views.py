from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken



# ------------------ HELPER ------------------
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }


# ------------------ SIGNUP ------------------
from django.db import IntegrityError, transaction
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from chelav.serializers import SignupSerializer
from chelav.models import AccountEmail
from chelav.email_auth import send_action_email
from smtplib import SMTPException


class SignupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": " ".join(str(message) for messages in serializer.errors.values() for message in messages),
                             "errors": serializer.errors}, status=400)
        try:
            with transaction.atomic():
                user = serializer.save()
                AccountEmail.objects.create(user=user, email=user.email)
                send_action_email(user, "verify")
        except IntegrityError:
            return Response({"error": "Username already exists"}, status=400)
        except (SMTPException, OSError):
            return Response({"error": "Could not send verification email. Please try signing up again later."}, status=503)
        return Response({"message": "Check your email to verify your account before logging in."}, status=201)


class LoginTokenView(TokenObtainPairView):
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class RefreshTokenView(TokenRefreshView):
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "refresh"

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except get_user_model().DoesNotExist:
            raise InvalidToken("The account no longer exists") from None


LoginView = LoginTokenView


# ------------------ LOGOUT ------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_token = request.data.get("refresh")
        if not isinstance(raw_token, str) or not raw_token:
            return Response({"error": "Refresh token required"}, status=400)
        try:
            token = RefreshToken(raw_token)
            if str(token.get("user_id")) != str(request.user.pk):
                return Response({"error": "Token does not belong to this account"}, status=400)
            token.blacklist()
        except TokenError:
            return Response({"error": "Invalid or expired refresh token"}, status=400)
        return Response({"message": "Logged out successfully"})
