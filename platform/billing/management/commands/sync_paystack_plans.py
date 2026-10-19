from django.core.management.base import BaseCommand

from billing import paystack
from billing.models import Plan, Subscription


class Command(BaseCommand):
    help = (
        "Create a Paystack Plan for every (tier x billing cycle) that doesn't "
        "have one yet, and save the resulting plan_code onto Plan. Safe to "
        "re-run — skips any plan that already has a code. Run this once "
        "after setting PAYSTACK_SECRET_KEY, and again if you ever add a new "
        "pricing tier or change a price (a new Paystack Plan is needed; the "
        "old one is left alone so existing subscribers keep their price)."
    )

    def handle(self, *args, **options):
        if not paystack.is_configured():
            self.stderr.write(self.style.ERROR('PAYSTACK_SECRET_KEY is not set — nothing to do.'))
            return

        for plan in Plan.objects.all():
            self._sync_one(plan, Subscription.MONTHLY, 'monthly', plan.price, 'paystack_plan_code_monthly')
            self._sync_one(plan, Subscription.ANNUAL, 'annually', plan.annual_price, 'paystack_plan_code_annual')

    def _sync_one(self, plan, cycle_label, interval, amount, field_name):
        if getattr(plan, field_name):
            self.stdout.write(f"{plan.name} ({cycle_label}): already synced — {getattr(plan, field_name)}")
            return

        name = f"Alpha Dev Stores - {plan.name} ({cycle_label})"
        result = paystack.create_plan(name=name, amount_naira=amount, interval=interval)

        if not result.get('status'):
            self.stderr.write(self.style.ERROR(
                f"{plan.name} ({cycle_label}): failed — {result.get('message', result)}"
            ))
            return

        plan_code = result['data']['plan_code']
        setattr(plan, field_name, plan_code)
        plan.save(update_fields=[field_name])
        self.stdout.write(self.style.SUCCESS(f"{plan.name} ({cycle_label}): created - {plan_code}"))
