from datetime import timedelta
from decimal import Decimal
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core import mail
from django.test import override_settings
from urllib.parse import urlsplit, parse_qs
import re
from unittest.mock import patch
from rest_framework.throttling import ScopedRateThrottle
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Category, Expense, Income


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class FinanceAndAuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alice", password="Valid-secret-739!")
        self.other = User.objects.create_user(username="bob", password="Valid-secret-841!")
        self.category = Category.objects.create(name="Food")
        self.today = timezone.localdate()
        self.client.force_authenticate(self.user)

    def test_signup_rejects_weak_password(self):
        self.client.force_authenticate(None)
        result = self.client.post("/signup/", {"username": "newuser", "password": "123", "password2": "123", "email": "weak@example.com"})
        self.assertEqual(result.status_code, 400)
        self.assertFalse(User.objects.filter(username="newuser").exists())

    def test_signup_and_login(self):
        self.client.force_authenticate(None)
        result = self.client.post("/signup/", {"username": "newuser", "password": "Strong-secret-384!", "password2": "Strong-secret-384!", "email": "new@example.com"})
        self.assertEqual(result.status_code, 201)
        self.assertNotIn("tokens", result.data)
        self.assertFalse(User.objects.get(username="newuser").is_active)
        denied = self.client.post("/api/token/", {"username": "newuser", "password": "Strong-secret-384!"})
        self.assertEqual(denied.status_code, 401)
        link = re.search(r"http[^\s]+", mail.outbox[-1].body).group()
        token = parse_qs(urlsplit(link).fragment)["token"][0]
        self.assertEqual(self.client.post("/verify-email/", {"token": token}).status_code, 200)
        result = self.client.post("/api/token/", {"username": "newuser", "password": "Strong-secret-384!"})
        self.assertEqual(result.status_code, 200)
        self.assertIn("access", result.data)

    def test_signup_rejects_duplicate_and_invalid_username(self):
        self.client.force_authenticate(None)
        for name in ["alice", "not valid!"]:
            result = self.client.post("/signup/", {"username": name, "password": "Strong-secret-384!", "password2": "Strong-secret-384!", "email": "new@example.com"})
            self.assertEqual(result.status_code, 400)

    def test_private_endpoints_require_login(self):
        self.client.force_authenticate(None)
        for path in ["/expense-overview/", "/show-expenses/", "/analytics/", "/user-details/"]:
            self.assertEqual(self.client.get(path).status_code, 401)

    def test_refresh_rotates_and_blacklists_old_token(self):
        self.client.force_authenticate(None)
        original = str(RefreshToken.for_user(self.user))
        result = self.client.post("/api/token/refresh/", {"refresh": original})
        self.assertEqual(result.status_code, 200)
        self.assertNotEqual(result.data["refresh"], original)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": original}).status_code, 401)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": result.data["refresh"]}).status_code, 200)

    def test_logout_rejects_other_users_token(self):
        token = str(RefreshToken.for_user(self.other))
        self.assertEqual(self.client.post("/logout/", {"refresh": token}).status_code, 400)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": token}).status_code, 200)

    def test_logout_revokes_own_refresh(self):
        token = str(RefreshToken.for_user(self.user))
        self.assertEqual(self.client.post("/logout/", {"refresh": token}).status_code, 200)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": token}).status_code, 401)

    @patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"login": "2/min", "signup": "5/min", "refresh": "60/min"})
    def test_login_is_throttled(self):
        self.client.force_authenticate(None)
        for _ in range(2):
            self.assertEqual(self.client.post("/api/token/", {"username": "alice", "password": "incorrect"}).status_code, 401)
        self.assertEqual(self.client.post("/api/token/", {"username": "alice", "password": "incorrect"}).status_code, 429)

    def test_balance_and_monthly_totals_are_consistent_and_private(self):
        prior_month = self.today.replace(day=1) - timedelta(days=1)
        Income.objects.create(user=self.user, amount="100.10", source="Salary", date=prior_month)
        Income.objects.create(user=self.user, amount="50.20", source="Salary", date=self.today)
        Expense.objects.create(user=self.user, amount="10.10", category=self.category, date=prior_month)
        Expense.objects.create(user=self.user, amount="20.20", category=self.category, date=self.today)
        Income.objects.create(user=self.other, amount="9999", source="Other", date=self.today)
        result = self.client.get("/expense-overview/")
        self.assertEqual(Decimal(result.data["balance"]), Decimal("120.00"))
        self.assertEqual(Decimal(result.data["total_income_this_month"]), Decimal("50.20"))
        self.assertEqual(Decimal(result.data["total_expenses_this_month"]), Decimal("20.20"))

    def test_add_expense_and_negative_balance(self):
        result = self.client.post("/add-expense/", {"amount": "10.25", "category_id": self.category.id, "date": self.today.isoformat()})
        self.assertEqual(result.status_code, 201)
        overview = self.client.get("/expense-overview/").data
        self.assertEqual(result.data["current_balance"], overview["balance"])
        self.assertEqual(Decimal(overview["balance"]), Decimal("-10.25"))
        self.assertEqual(Decimal(overview["due"]), Decimal("10.25"))

    def test_invalid_money_and_date_are_rejected(self):
        for amount in ["NaN", "Infinity", "-1", "0", "1.001", "10000001"]:
            result = self.client.post("/add-income/", {"amount": amount, "source": "Salary", "date": self.today.isoformat()})
            self.assertEqual(result.status_code, 400, amount)
        self.assertEqual(self.client.post("/add-expense/", {"amount": "10", "category_id": self.category.id, "date": "bad"}).status_code, 400)
        self.assertEqual(Income.objects.count(), 0)
        self.assertEqual(Expense.objects.count(), 0)

    def test_income_and_expense_analytics_are_separate(self):
        Income.objects.create(user=self.user, amount="100.10", source="Salary", date=self.today)
        Expense.objects.create(user=self.user, amount="10.20", category=self.category, date=self.today)
        Expense.objects.create(user=self.other, amount="500", category=self.category, date=self.today)
        for kind, expected in [("income", "100.10"), ("expense", "10.20")]:
            for mode in ["daily", "monthly", "yearly"]:
                result = self.client.get("/analytics/", {"mode": mode, "type": kind})
                self.assertEqual(result.status_code, 200)
                self.assertEqual(sum(Decimal(row["amount"]) for row in result.data["data"]), Decimal(expected))

    def test_analytics_validates_ranges(self):
        for params in [{"mode": "bad"}, {"type": "bad"}, {"mode": "daily", "date": "bad"}, {"mode": "daily", "start_date": "2020-01-01", "end_date": "2026-01-01"}]:
            self.assertEqual(self.client.get("/analytics/", params).status_code, 400)

    def test_expense_list_is_private_and_end_date_works(self):
        Expense.objects.create(user=self.user, amount="10.25", category=self.category, date=self.today)
        Expense.objects.create(user=self.other, amount="99", category=self.category, date=self.today)
        self.assertEqual(self.client.get("/show-expenses/").data["count"], 1)
        self.assertEqual(self.client.get("/show-expenses/", {"end_date": (self.today - timedelta(days=1)).isoformat()}).data["count"], 0)
        self.assertEqual(self.client.get("/show-expenses/", {"page_size": 0}).status_code, 400)

    def test_fractional_totals_are_returned_as_two_decimal_strings(self):
        for amount in ["1.10", "2.20"]:
            Income.objects.create(user=self.user, amount=amount, source="Salary", date=self.today)
        result = self.client.get("/expense-overview/")
        self.assertEqual(result.data["balance"], "3.30")
        self.assertEqual(result.data["total_income_this_month"], "3.30")

    def test_recurring_income_requires_valid_frequency(self):
        payload = {"amount": "100", "source": "Salary", "date": self.today.isoformat(), "is_recurring": True}
        self.assertEqual(self.client.post("/add-income/", payload).status_code, 400)
        self.assertEqual(self.client.post("/add-income/", {**payload, "frequency": "daily"}).status_code, 400)
        self.assertEqual(self.client.post("/add-income/", {**payload, "frequency": "monthly"}).status_code, 201)

    def test_invalid_expense_filters_are_rejected(self):
        for params in [{"start_date": "bad"}, {"category_id": "bad"}, {"start_date": "2026-10-02", "end_date": "2026-10-01"}]:
            self.assertEqual(self.client.get("/show-expenses/", params).status_code, 400)

    def test_user_can_create_category_and_use_it(self):
        response = self.client.post("/categories/", {"name": "  Pets  ", "owner": self.other.id})
        self.assertEqual(response.status_code, 201)
        category = Category.objects.get(pk=response.data["category"]["id"])
        self.assertEqual(category.name, "Pets")
        self.assertEqual(category.owner, self.user)
        self.assertEqual(self.client.post("/add-expense/", {"amount": "10.00", "category_id": category.id, "date": self.today.isoformat()}).status_code, 201)

    def test_private_categories_cannot_be_listed_or_used_by_others(self):
        private = Category.objects.create(name="Private", owner=self.other)
        listed = self.client.get("/categories/").data["categories"]
        self.assertNotIn(private.id, [item["id"] for item in listed])
        self.assertIn(self.category.id, [item["id"] for item in listed])
        self.assertEqual(self.client.post("/add-expense/", {"amount": "10", "category_id": private.id}).status_code, 400)

    def test_category_names_validate_and_ignore_case_for_duplicates(self):
        self.assertEqual(self.client.post("/categories/", {"name": "Travel"}).status_code, 201)
        for name in ["travel", "  TRAVEL  ", "Food", "   ", "x" * 101]:
            self.assertEqual(self.client.post("/categories/", {"name": name}).status_code, 400)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post("/categories/", {"name": "Travel"}).status_code, 201)

    def test_categories_require_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/categories/").status_code, 401)
        self.assertEqual(self.client.post("/categories/", {"name": "Pets"}).status_code, 401)

    def test_delete_account_requires_password_and_confirmation(self):
        for payload in [{}, {"password": "incorrect", "confirm": True}, {"password": "Valid-secret-739!"}]:
            self.assertEqual(self.client.delete("/delete-account/", payload, format="json").status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_delete_account_removes_only_own_data_and_disables_tokens(self):
        from .models import AccountEmail, EmailActionToken
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        own_category = Category.objects.create(name="Private", owner=self.user)
        Expense.objects.create(user=self.user, amount="10", category=own_category, date=self.today)
        Income.objects.create(user=self.user, amount="20", source="Salary", date=self.today)
        Expense.objects.create(user=self.other, amount="30", category=self.category, date=self.today)
        AccountEmail.objects.create(user=self.user, email="alice@example.com")
        EmailActionToken.objects.create(user=self.user, digest="a" * 64, purpose="verify", expires_at=timezone.now()+timedelta(hours=1))
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        pk = self.user.pk
        response = self.client.delete("/delete-account/", {"password": "Valid-secret-739!", "confirm": True, "user_id": self.other.pk}, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=pk).exists())
        self.assertFalse(Expense.objects.filter(user_id=pk).exists())
        self.assertFalse(Income.objects.filter(user_id=pk).exists())
        self.assertFalse(Category.objects.filter(pk=own_category.pk).exists())
        self.assertFalse(AccountEmail.objects.filter(user_id=pk).exists())
        self.assertFalse(EmailActionToken.objects.filter(user_id=pk).exists())
        self.assertFalse(OutstandingToken.objects.filter(user_id=pk).exists())
        self.assertTrue(User.objects.filter(pk=self.other.pk).exists())
        self.assertEqual(Expense.objects.filter(user=self.other).count(), 1)
        self.assertTrue(Category.objects.filter(pk=self.category.pk).exists())
        self.client.force_authenticate(None)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        self.assertEqual(self.client.get("/user-details/").status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post("/api/token/refresh/", {"refresh": str(refresh)}).status_code, 401)

    def test_delete_account_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.delete("/delete-account/", {"password": "Valid-secret-739!", "confirm": True}, format="json").status_code, 401)
