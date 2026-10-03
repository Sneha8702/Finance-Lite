import re
from datetime import timedelta
from smtplib import SMTPException
from unittest.mock import patch
from urllib.parse import urlsplit, parse_qs
from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AccountEmail, EmailActionToken
from .email_auth import send_action_email, digest_token


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailAuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="pending", email="pending@example.com", password="Strong-secret-384!", is_active=False)
        self.account = AccountEmail.objects.create(user=self.user, email=self.user.email)

    def token(self, purpose="verify"):
        send_action_email(self.user, purpose)
        url = re.search(r"http[^\s]+", mail.outbox[-1].body).group()
        return parse_qs(urlsplit(url).fragment)["token"][0]

    def verified(self):
        self.user.is_active = True
        self.user.save()
        self.account.verified_at = timezone.now()
        self.account.save()

    def test_verification_is_single_use_and_hash_only(self):
        raw = self.token()
        self.assertIn("Verify your email", mail.outbox[-1].alternatives[0].content)
        self.assertFalse(EmailActionToken.objects.filter(digest=raw).exists())
        self.assertTrue(EmailActionToken.objects.filter(digest=digest_token(raw)).exists())
        self.assertEqual(self.client.post("/verify-email/", {"token": raw}).status_code, 200)
        self.assertEqual(self.client.post("/verify-email/", {"token": raw}).status_code, 400)
        self.user.refresh_from_db()
        self.account.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertIsNotNone(self.account.verified_at)

    def test_expired_wrong_purpose_and_invalid_tokens_fail(self):
        raw = self.token()
        self.assertEqual(self.client.post("/reset-password/", {"token": raw}).status_code, 400)
        EmailActionToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post("/verify-email/", {"token": raw}).status_code, 400)
        self.assertEqual(self.client.post("/verify-email/", {"token": "invalid"}).status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_resend_does_not_change_account_password(self):
        original = self.user.password
        self.assertEqual(self.client.post("/resend-verification/", {"email": "PENDING@example.com"}).status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.user.refresh_from_db()
        self.assertEqual(self.user.password, original)

    def test_requests_do_not_reveal_existing_addresses(self):
        unknown = self.client.post("/resend-verification/", {"email": "missing@example.com"})
        known = self.client.post("/resend-verification/", {"email": self.user.email})
        self.assertEqual(unknown.data, known.data)
        self.assertEqual(unknown.status_code, known.status_code)

    def test_reset_revokes_old_tokens_and_other_reset_links(self):
        self.verified()
        refresh = str(RefreshToken.for_user(self.user))
        access = str(RefreshToken.for_user(self.user).access_token)
        raw = self.token("reset")
        other = self.token("reset")
        response = self.client.post("/reset-password/", {"token": raw, "password": "New-secret-847!", "password2": "New-secret-847!"})
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New-secret-847!"))
        self.assertEqual(self.client.post("/reset-password/", {"token": other, "password": "New-secret-847!", "password2": "New-secret-847!"}).status_code, 400)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": refresh}).status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        self.assertEqual(self.client.get("/user-details/").status_code, 401)

    def test_weak_reset_does_not_consume_token(self):
        self.verified()
        raw = self.token("reset")
        response = self.client.post("/reset-password/", {"token": raw, "password": "123", "password2": "123"})
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(EmailActionToken.objects.get(digest=digest_token(raw)).consumed_at)

    def test_forgot_password_requires_verified_active_email(self):
        self.client.post("/forgot-password/", {"email": self.user.email})
        self.assertEqual(len(mail.outbox), 0)
        self.verified()
        self.client.post("/forgot-password/", {"email": self.user.email})
        self.assertEqual(len(mail.outbox), 1)

    @patch("chelav.email_auth.send_mail", side_effect=SMTPException("unavailable"))
    def test_signup_delivery_failure_rolls_back(self, send):
        response = self.client.post("/signup/", {"username": "new", "email": "new@example.com", "password": "Strong-secret-384!", "password2": "Strong-secret-384!"})
        self.assertEqual(response.status_code, 503)
        self.assertFalse(User.objects.filter(username="new").exists())

    def test_duplicate_email_is_case_insensitive(self):
        response = self.client.post("/signup/", {"username": "new", "email": "PENDING@example.com", "password": "Strong-secret-384!", "password2": "Strong-secret-384!"})
        self.assertEqual(response.status_code, 400)

    def test_email_requests_are_throttled(self):
        for _ in range(5):
            self.assertEqual(self.client.post("/forgot-password/", {"email": "missing@example.com"}).status_code, 200)
        self.assertEqual(self.client.post("/forgot-password/", {"email": "missing@example.com"}).status_code, 429)
