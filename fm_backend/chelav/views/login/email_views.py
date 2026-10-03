import logging
from smtplib import SMTPException
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from chelav.models import AccountEmail, EmailActionToken
from chelav.email_auth import digest_token, send_action_email


logger = logging.getLogger(__name__)


class EmailInput(serializers.Serializer):
    email = serializers.EmailField()


class ActionInput(serializers.Serializer):
    token = serializers.CharField(max_length=128, trim_whitespace=False)
    password = serializers.CharField(required=False, trim_whitespace=False)
    password2 = serializers.CharField(required=False, trim_whitespace=False)


class PublicEmailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_action"


class RequestEmailView(PublicEmailView):
    purpose = "verify"

    def post(self, request):
        data = EmailInput(data=request.data)
        if not data.is_valid():
            return Response({"error": "Enter a valid email address"}, status=400)
        account = AccountEmail.objects.filter(email=data.validated_data["email"].lower()).select_related("user").first()
        eligible = account and (
            account.verified_at is None if self.purpose == "verify"
            else account.verified_at is not None and account.user.is_active
        )
        if eligible:
            try:
                with transaction.atomic():
                    send_action_email(account.user, self.purpose)
            except (SMTPException, OSError) as exc:
                # Same public response prevents revealing which addresses exist.
                logger.warning("Email delivery failed: %s (SMTP code %s). Run python manage.py check_email.", type(exc).__name__, getattr(exc, "smtp_code", None))
        return Response({"message": "If this address is eligible, an email will arrive shortly. Check your spam folder too."})


class ForgotPasswordView(RequestEmailView):
    purpose = "reset"


class ConfirmEmailView(PublicEmailView):
    throttle_scope = "email_confirm"
    purpose = "verify"

    def post(self, request):
        data = ActionInput(data=request.data)
        if not data.is_valid():
            return Response({"error": "Invalid request"}, status=400)
        now = timezone.now()
        with transaction.atomic():
            token = EmailActionToken.objects.select_related("user").filter(
                digest=digest_token(data.validated_data["token"]), purpose=self.purpose,
                expires_at__gt=now, consumed_at__isnull=True).first()
            if not token:
                return Response({"error": "This link is invalid, expired or already used. Request a new email."}, status=400)
            user = token.user
            account = AccountEmail.objects.select_for_update().filter(user=user).first()
            # Lock the account before action tokens to serialize concurrent confirmations.
            if account:
                token = EmailActionToken.objects.select_for_update().filter(pk=token.pk, consumed_at__isnull=True, expires_at__gt=timezone.now()).first()
            if not token:
                return Response({"error": "This link is no longer valid"}, status=400)
            if not account or (self.purpose == "verify" and account.verified_at is not None) or (self.purpose == "reset" and (not user.is_active or account.verified_at is None)):
                return Response({"error": "This link is no longer valid"}, status=400)
            if self.purpose == "reset":
                password = data.validated_data.get("password")
                if not password or password != data.validated_data.get("password2"):
                    return Response({"error": "Enter matching passwords"}, status=400)
                try:
                    validate_password(password, user)
                except ValidationError as exc:
                    return Response({"error": " ".join(exc.messages)}, status=400)
                user.set_password(password)
                user.save(update_fields=["password"])
                for outstanding in OutstandingToken.objects.filter(user=user):
                    BlacklistedToken.objects.get_or_create(token=outstanding)
            else:
                account.verified_at = now
                account.save(update_fields=["verified_at"])
                user.is_active = True
                user.save(update_fields=["is_active"])
            EmailActionToken.objects.filter(user=user, purpose=self.purpose, consumed_at__isnull=True).update(consumed_at=now)
        return Response({"message": "Email verified. You can now log in." if self.purpose == "verify" else "Password changed. Log in with your new password."})


class ResetPasswordView(ConfirmEmailView):
    purpose = "reset"
