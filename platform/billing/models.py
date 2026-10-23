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

    # Paystack bills monthly and annual as separate Plan objects on their
    # side. Populated by `manage.py sync_paystack_plans` — blank until then,
    # which checkout() treats as "no real Paystack plan yet, fall back to a
    # plain one-time charge" rather than erroring.
    paystack_plan_code_monthly = models.CharField(max_length=100, blank=True)
    paystack_plan_code_annual = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} (NGN {self.price:,.0f}/mo)"

    # Annual = 10x the monthly price ("2 months free") — the standard SaaS
    # annual-discount convention. Derived from price rather than stored, so
    # it always stays in sync if the monthly price ever changes.
    ANNUAL_MONTHS = 10

    @property
    def annual_price(self):
        return self.price * self.ANNUAL_MONTHS

    @property
    def annual_monthly_equivalent(self):
        return self.annual_price / 12


class Subscription(models.Model):
    TRIALING = 'trialing'
    ACTIVE = 'active'
    PAST_DUE = 'past_due'
    PAUSED = 'paused'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (TRIALING, 'Trialing (live for free, one-time, until the trial ends)'),
        (ACTIVE, 'Active'),
        (PAST_DUE, 'Past due (grace period)'),
        (PAUSED, 'Paused'),
        (CANCELLED, 'Cancelled'),
    ]

    MONTHLY = 'monthly'
    ANNUAL = 'annual'
    BILLING_CYCLE_CHOICES = [(MONTHLY, 'Monthly'), (ANNUAL, 'Annual')]
    PERIOD_DAYS = {MONTHLY: 30, ANNUAL: 365}

    GRACE_DAYS = 5
    TRIAL_DAYS = 3

    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=TRIALING)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES, default=MONTHLY)

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
        if self.status == self.TRIALING:
            return bool(self.current_period_end and timezone.now() < self.current_period_end)
        if self.status == self.PAST_DUE:
            return bool(self.grace_period_end and timezone.now() < self.grace_period_end)
        return False

    @property
    def trial_days_left(self):
        if self.status != self.TRIALING or not self.current_period_end:
            return 0
        remaining = self.current_period_end - timezone.now()
        return max(0, remaining.days + (1 if remaining.seconds > 0 else 0))

    def mark_past_due(self):
        self.status = self.PAST_DUE
        self.grace_period_end = timezone.now() + timezone.timedelta(days=self.GRACE_DAYS)
        self.save(update_fields=['status', 'grace_period_end'])

    def mark_active(self, period_end):
        self.status = self.ACTIVE
        self.current_period_end = period_end
        self.grace_period_end = None
        self.save(update_fields=['status', 'current_period_end', 'grace_period_end'])

        # Back in good standing — clear any pending-deletion warning so a
        # *future* lapse gets its own fresh warning instead of staying
        # silent because one was already sent for this earlier lapse.
        if self.store.deletion_warning_sent_at:
            self.store.deletion_warning_sent_at = None
            self.store.save(update_fields=['deletion_warning_sent_at'])

    def start_trial(self):
        self.status = self.TRIALING
        self.current_period_end = timezone.now() + timezone.timedelta(days=self.TRIAL_DAYS)
        self.grace_period_end = None
        self.save(update_fields=['status', 'current_period_end', 'grace_period_end'])


class PaymentLog(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    billing_cycle = models.CharField(max_length=10, choices=Subscription.BILLING_CYCLE_CHOICES, default=Subscription.MONTHLY)
    status = models.CharField(max_length=20, default='pending')
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} — {self.status}"


class WebhookEvent(models.Model):
    """Raw record of every Paystack webhook call we receive, kept regardless
    of whether we understood/handled it. Paystack's published docs don't
    show the exact payload shape for the subscription-lifecycle events, so
    this is how we confirm real field names from live traffic instead of
    guessing — and a safety net if a handler ever needs retrying by hand."""
    event_type = models.CharField(max_length=100)
    raw_body = models.JSONField(default=dict, blank=True)
    handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} @ {self.created_at:%Y-%m-%d %H:%M}"
