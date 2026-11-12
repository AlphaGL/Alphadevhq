from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

INACTIVE_DAYS = 180       # a Free site whose owner hasn't logged in this long is hidden (not deleted)
WARNING_DAYS_BEFORE = 7   # send the one heads-up email this many days before hiding it
EVENT_LOG_RETENTION_DAYS = 180  # how long raw webhook/visit rows are kept before pruning


class Command(BaseCommand):
    help = (
        "Daily maintenance: expires lapsed subscriptions that slipped through "
        "without a Paystack webhook (they drop to Free, never offline), hides "
        "abandoned Free sites whose owner hasn't logged in for months, and "
        "prunes old WebhookEvent/DailyVisit rows. Nothing is ever deleted. "
        "Meant to run once a day via cron."
    )

    def handle(self, *args, **options):
        self._expire_lapsed_active()
        self._hide_abandoned_free_sites()
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
    # Free sites stay up as long as someone still looks after them. One
    # untouched for INACTIVE_DAYS gets a heads-up email, then is hidden
    # (unpublished, nothing deleted) — logging in and pressing Publish
    # brings it straight back. Paid sites are never touched here.
    # ------------------------------------------------------------------
    def _hide_abandoned_free_sites(self):
        from stores.models import Store

        now = timezone.now()
        warn_before = now - timezone.timedelta(days=INACTIVE_DAYS - WARNING_DAYS_BEFORE)
        stores = Store.objects.filter(is_published=True, external_url='').select_related('owner', 'subscription__plan')

        hidden = warned = 0
        for store in stores:
            last_seen = store.owner.last_login or store.owner.date_joined
            if last_seen > warn_before or not store.is_on_free_plan:
                # Active again since a warning went out — allow a fresh one later.
                if store.deletion_warning_sent_at and last_seen > store.deletion_warning_sent_at:
                    store.deletion_warning_sent_at = None
                    store.save(update_fields=['deletion_warning_sent_at'])
                continue

            idle_days = (now - last_seen).days
            warning = store.deletion_warning_sent_at
            # Always give the full WARNING_DAYS_BEFORE after the email, even
            # for someone already past INACTIVE_DAYS when they're first seen.
            warned_long_enough = bool(warning and now - warning >= timezone.timedelta(days=WARNING_DAYS_BEFORE))
            if idle_days >= INACTIVE_DAYS and warned_long_enough:
                store.is_published = False
                store.save(update_fields=['is_published'])
                self.stdout.write(f"Hid '{store.business_name}' ({store.slug}): owner inactive {idle_days} days.")
                hidden += 1
            elif not warning and self._send_warning(store, max(INACTIVE_DAYS - idle_days, WARNING_DAYS_BEFORE)):
                warned += 1

        if hidden or warned:
            self.stdout.write(f"Inactive Free sites: hid {hidden}, warned {warned}.")

    def _send_warning(self, store, days_left):
        """One heads-up email per idle stretch. Returns True if sent."""
        from django.conf import settings

        if store.deletion_warning_sent_at or not store.owner.email:
            return False
        login_url = f"https://www.{settings.PLATFORM_DOMAIN}/accounts/login/"
        try:
            send_mail(
                subject=f"Is '{store.business_name}' still open? Log in to keep your site online",
                message=(
                    f"Hi,\n\nYou haven't logged in to Alpha Dev for a while. To keep your free site "
                    f"'{store.business_name}' online, just log in once in the next {days_left} days:\n"
                    f"{login_url}\n\n"
                    f"If you don't, we'll hide the site (nothing is deleted). You can put it back any time "
                    f"by logging in and pressing Publish.\n\n— Alpha Dev"
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
