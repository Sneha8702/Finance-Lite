from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Expense, Category, Income


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'category', 'date')  # columns shown
    list_filter = ('user', 'category', 'date')             # right side filters
    search_fields = ('user__username', 'category__name')   # search bar


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner')
    list_filter = ('owner',)
    search_fields = ('name', 'owner__username')


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'source', 'date')
    list_filter = ('user', 'date')