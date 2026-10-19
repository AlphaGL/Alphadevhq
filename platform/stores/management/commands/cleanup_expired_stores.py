from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

TRIAL_GRACE_DAYS = 14   # delete a never-paid trial store this long after the trial ends
PAST_DUE_GRACE_DAYS = 60  # delete a lapsed-but-previously-paid store this long after it stops being live
WARNING_DAYS_BEFORE = 5   # send the one warning email this many days before the actual deletion
EVENT_LOG_RETENTION_DAYS = 180  # how long raw webhook/visit rows are kept before pruning


class Command(BaseCommand):
    help = (
        "Daily maintenance: expires lapsed subscriptions that slipped through "
        "without a Paystack webhook, warns and then deletes stores that have "
        "gone unpaid too long, and prunes old WebhookEvent/DailyVisit rows so "
        "the database doesn't grow forever. Meant to run once a day via cron."
    )

    def handle(self, *args, **options):
        self._expire_lapsed_active()
        self._warn_and_delete_trials()
        self._warn_and_delete_past_due()
        self._prune_old_logs()

    # ------------------------------------------------------------------
    # Safety net: an ACTIVE subscription whose paid period has quietly run
    # out (e.g. a real Paystack webhook never arrived) gets the same
    # past_due treatment a failed-renewal webhook would have given it.
    # ------------------------------------------------------------------
    def _expire_lapsed_active(self):
        from billing.models import Subscription

        now = timezone.now()
        lapsed = Subscription.objects.filter(status=Subscription.ACTIVE, current_period_end__lt=now)
        count = 0
        for sub in lapsed:
            sub.mark_past_due()
            count += 1
        if count:
            self.stdout.write(f"Marked {count} lapsed ACTIVE subscription(s) as past_due.")

    # ------------------------------------------------------------------
    def _warn_and_delete_trials(self):
        from billing.models import Subscription
        from stores.models import Store

        now = timezone.now()
        candidates = Store.objects.filter(
            subscription__status=Subscription.TRIALING,
            subscription__current_period_end__isnull=False,
            subscription__current_period_end__lt=now,
        ).select_related('subscription', 'owner')

        deleted = warned = 0
        for store in candidates:
            days_since_trial_end = (now - store.subscription.current_period_end).days
            if days_since_trial_end >= TRIAL_GRACE_DAYS:
                self._delete_store(store, reason="free trial ended and was never paid for")
                deleted += 1
            elif days_since_trial_end >= TRIAL_GRACE_DAYS - WARNING_DAYS_BEFORE:
                if self._send_warning(store, TRIAL_GRACE_DAYS - days_since_trial_end):
                    warned += 1

        if deleted or warned:
            self.stdout.write(f"Trials: deleted {deleted}, warned {warned}.")

    def _warn_and_delete_past_due(self):
        from billing.models import Subscription
        from stores.models import Store

        now = timezone.now()
        candidates = Store.objects.filter(
            subscription__status=Subscription.PAST_DUE,
            subscription__grace_period_end__isnull=False,
            subscription__grace_period_end__lt=now,
        ).select_related('subscription', 'owner')

        deleted = warned = 0
        for store in candidates:
            days_since_grace_end = (now - store.subscription.grace_period_end).days
            if days_since_grace_end >= PAST_DUE_GRACE_DAYS:
                self._delete_store(store, reason="payment lapsed and was never renewed")
                deleted += 1
            elif days_since_grace_end >= PAST_DUE_GRACE_DAYS - WARNING_DAYS_BEFORE:
                if self._send_warning(store, PAST_DUE_GRACE_DAYS - days_since_grace_end):
                    warned += 1

        if deleted or warned:
            self.stdout.write(f"Past due: deleted {deleted}, warned {warned}.")

    # ------------------------------------------------------------------
    def _send_warning(self, store, days_left):
        """One warning email per store, right before it's actually deleted.
        Returns True if an email was sent this run."""
        if store.deletion_warning_sent_at:
            return False
        if not store.owner.email:
            return False

        try:
            send_mail(
                subject=f"Your store '{store.business_name}' will be removed in {days_left} days",
                message=(
                    f"Hi,\n\nYour Alpha Dev Stores site '{store.business_name}' hasn't been paid for "
                    f"in a while, and it will be permanently deleted in {days_left} days if nothing changes.\n\n"
                    f"To keep it, just log in and renew: https://alphadevhq.vercel.app/accounts/login/\n\n"
                    f"If you meant to let it go, no action is needed.\n\n— Alpha Dev"
                ),
                from_email=None,
                recipient_list=[store.owner.email],
                fail_silently=True,
            )
        except Exception:
            return False

        store.deletion_warning_sent_at = timezone.now()
        store.save(update_fields=['deletion_warning_sent_at'])
        return True

    def _delete_store(self, store, reason):
        self.stdout.write(f"Deleting '{store.business_name}' ({store.slug}) — {reason}.")
        store.delete()

    # ------------------------------------------------------------------
    def _prune_old_logs(self):
        from billing.models import WebhookEvent
        from stores.models import DailyVisit

        cutoff = timezone.now() - timezone.timedelta(days=EVENT_LOG_RETENTION_DAYS)
        events, _ = WebhookEvent.objects.filter(created_at__lt=cutoff).delete()

        visit_cutoff = timezone.localdate() - timezone.timedelta(days=EVENT_LOG_RETENTION_DAYS)
        visits, _ = DailyVisit.objects.filter(date__lt=visit_cutoff).delete()

        if events or visits:
            self.stdout.write(f"Pruned {events} old webhook event(s) and {visits} old daily-visit row(s).")
