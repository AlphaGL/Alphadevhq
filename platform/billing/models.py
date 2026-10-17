from django.db import models
from django.utils import timezone


class Plan(models.Model):
    STARTER = 'starter'
    BUSINESS = 'business'
    PRO = 'pro'
    TIER_CHOICES = [(STARTER, 'Starter'), (BUSINESS, 'Business'), (PRO, 'Pro')]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_limit = models.PositiveIntegerField()
    page_limit = models.PositiveIntegerField(default=1)
    description = models.CharField(max_length=255, blank=True)
    features = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} (NGN {self.price:,.0f}/mo)"


class Subscription(models.Model):
    TRIALING = 'trialing'
    ACTIVE = 'active'
    PAST_DUE = 'past_due'
    PAUSED = 'paused'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (TRIALING, 'Trialing (building, not yet live)'),
        (ACTIVE, 'Active'),
        (PAST_DUE, 'Past due (grace period)'),
        (PAUSED, 'Paused'),
        (CANCELLED, 'Cancelled'),
    ]

    GRACE_DAYS = 5

    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=TRIALING)

    paystack_customer_code = models.CharField(max_length=100, blank=True)
    paystack_subscription_code = models.CharField(max_length=100, blank=True)
    paystack_authorization_code = models.CharField(max_length=100, blank=True)

    current_period_end = models.DateTimeField(null=True, blank=True)
    grace_period_end = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.store.business_name} — {self.plan.name} ({self.get_status_display()})"

    @property
    def is_live(self):
        """Whether the public store page should actually be reachable."""
        if self.status == self.ACTIVE:
            return True
        if self.status == self.PAST_DUE:
            return bool(self.grace_period_end and timezone.now() < self.grace_period_end)
        return False

    def mark_past_due(self):
        self.status = self.PAST_DUE
        self.grace_period_end = timezone.now() + timezone.timedelta(days=self.GRACE_DAYS)
        self.save(update_fields=['status', 'grace_period_end'])

    def mark_active(self, period_end):
        self.status = self.ACTIVE
        self.current_period_end = period_end
        self.grace_period_end = None
        self.save(update_fields=['status', 'current_period_end', 'grace_period_end'])


class PaymentLog(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} — {self.status}"
