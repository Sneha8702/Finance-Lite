# Create your models here.
from django.db import models
from django.db.models.functions import Lower
from django.contrib.auth.models import User


# 🔹 Category Model (Better than using plain text)
class Category(models.Model):
    name = models.CharField(max_length=100)
    # Null owner preserves existing administrator-created shared categories.
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="expense_categories")

    class Meta:
        constraints = [models.UniqueConstraint(Lower("name"), "owner", name="unique_user_category_name")]

    def __str__(self):
        return self.name


# 🔹 Expense Model
class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)
    date = models.DateField()

    def __str__(self):
        return f"{self.user.username} - {self.category} - {self.amount}"


# 🔹 Income Model
class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=100)
    date = models.DateField()

    is_recurring = models.BooleanField(default=False)
    frequency = models.CharField(
        max_length=20,
        choices=[('monthly', 'Monthly')],
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.source} - {self.amount}"


# 🔹 (Optional - Future Use) Family Model
class Family(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User)

    def __str__(self):
        return self.name


class AccountEmail(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account_email")
    email = models.EmailField(unique=True)
    verified_at = models.DateTimeField(null=True, blank=True)


class EmailActionToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    digest = models.CharField(max_length=64, unique=True)
    purpose = models.CharField(max_length=10, choices=[("verify", "Verify"), ("reset", "Reset")])
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
