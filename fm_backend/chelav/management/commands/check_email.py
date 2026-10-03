from smtplib import SMTPException
from django.conf import settings
from django.core.mail import get_connection
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Check email configuration and SMTP authentication without sending email or printing credentials."

    def handle(self, *args, **options):
        self.stdout.write(f"Email backend: {settings.EMAIL_BACKEND}")
        if settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend":
            raise CommandError("SMTP delivery is disabled. Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend in fm_backend/.env and restart Django.")
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            raise CommandError("Set BREVO_SMTP_LOGIN and BREVO_SMTP_KEY in fm_backend/.env.")
        if "example.com" in settings.DEFAULT_FROM_EMAIL or "your-verified" in settings.DEFAULT_FROM_EMAIL:
            raise CommandError("Replace DEFAULT_FROM_EMAIL with your verified Brevo sender address.")
        try:
            with get_connection() as connection:
                connection.open()
        except (SMTPException, OSError) as exc:
            code = getattr(exc, "smtp_code", None)
            advice = {
                525: "Brevo rejected the connecting IP address. Authorize your backend's outbound public IP in Brevo's SMTP security settings.",
                535: "Brevo rejected authentication. Check the SMTP login and SMTP key (not an API key).",
            }.get(code, "Check SMTP connectivity, TLS, credentials and provider status.")
            raise CommandError(f"SMTP check failed ({type(exc).__name__}, code={code}). {advice}") from None
        self.stdout.write(self.style.SUCCESS("SMTP connection and authentication succeeded. No email sent. Sender approval and inbox delivery still need verification."))
