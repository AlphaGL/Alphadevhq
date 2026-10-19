from django.contrib import admin

from .models import PaymentLog, Plan, Subscription, WebhookEvent


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'price', 'image_limit', 'page_limit', 'order', 'paystack_plan_code_monthly', 'paystack_plan_code_annual')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order',)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('store', 'plan', 'status', 'current_period_end', 'grace_period_end')
    list_filter = ('status', 'plan')
    search_fields = ('store__business_name',)


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ('reference', 'subscription', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('reference',)


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'handled', 'created_at')
    list_filter = ('event_type', 'handled')
    readonly_fields = ('event_type', 'raw_body', 'handled', 'created_at')
