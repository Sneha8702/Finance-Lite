import hashlib
import secrets
from datetime import timedelta
from urllib.parse import urlencode
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import format_html
from .models import EmailActionToken


def digest_token(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


def send_action_email(user, purpose):
    raw = secrets.token_urlsafe(32)
    seconds = settings.EMAIL_VERIFICATION_SECONDS if purpose == "verify" else settings.PASSWORD_RESET_TIMEOUT
    now = timezone.now()
    EmailActionToken.objects.create(user=user, purpose=purpose, digest=digest_token(raw), expires_at=now + timedelta(seconds=seconds))
    path = "verify-email" if purpose == "verify" else "reset-password"
    link = f"{settings.FRONTEND_URL}/{path}#" + urlencode({"token": raw})
    action = "Verify your email" if purpose == "verify" else "Reset your password"
    send_mail(f"Finance Lite: {action}",
              f"{action} using this link:\n\n{link}\n\nThis link expires in {seconds // 3600} hour(s). If you did not request this, ignore this email.",
              settings.DEFAULT_FROM_EMAIL, [user.account_email.email], fail_silently=False,
              html_message=format_html(
                  '<h2>Finance Lite</h2><p>{}</p><p><a href="{}" style="display:inline-block;padding:12px 20px;background:#6d28d9;color:white;text-decoration:none;border-radius:8px">{}</a></p><p>This link expires in {} hour(s). If you did not request this, ignore this email.</p>',
                  action, link, action, seconds // 3600))
