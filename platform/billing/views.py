import hashlib
import hmac
import json
import uuid

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from stores.models import Store

from . import paystack
from .models import PaymentLog, Plan, Subscription


@login_required
def choose_plan(request, store_slug):
    store = get_object_or_404(Store, slug=store_slug, owner=request.user)
    plans = Plan.objects.all()
    trial_available = not request.user.profile.trial_used_at
    return render(request, 'billing/choose_plan.html', {
        'store': store, 'plans': plans, 'trial_available': trial_available,
    })


@login_required
def start_trial(request, store_slug, plan_slug):
    """One free live trial per account (not per store) — the Starter plan's
    page/image limits apply, but no payment is taken and the store goes
    live immediately for Subscription.TRIAL_DAYS."""
    if request.method != 'POST':
        return redirect('billing:choose_plan', store_slug=store_slug)

    store = get_object_or_404(Store, slug=store_slug, owner=request.user)
    profile = request.user.profile
    if profile.trial_used_at:
        messages.warning(request, "You've already used your free trial — pick a plan to publish this store.")
        return redirect('billing:choose_plan', store_slug=store.slug)

    plan = get_object_or_404(Plan, slug=plan_slug)
    subscription, _ = Subscription.objects.get_or_create(store=store, defaults={'plan': plan})
    subscription.plan = plan
    subscription.save(update_fields=['plan'])
    subscription.start_trial()

    profile.trial_used_at = timezone.now()
    profile.save(update_fields=['trial_used_at'])

    store.is_published = True
    store.save(update_fields=['is_published'])

    messages.success(
        request,
        f"Your store is live for a free {Subscription.TRIAL_DAYS}-day trial. "
        "Pick a plan before it ends to keep it live.",
    )
    return redirect('stores:dashboard', store_slug=store.slug)


@login_required
def checkout(request, store_slug, plan_slug):
    store = get_object_or_404(Store, slug=store_slug, owner=request.user)
    plan = get_object_or_404(Plan, slug=plan_slug)

    cycle = request.POST.get('cycle', Subscription.MONTHLY)
    if cycle not in Subscription.PERIOD_DAYS:
        cycle = Subscription.MONTHLY
    amount = plan.annual_price if cycle == Subscription.ANNUAL else plan.price

    subscription, _ = Subscription.objects.get_or_create(
        store=store, defaults={'plan': plan, 'status': Subscription.TRIALING, 'billing_cycle': cycle},
    )
    subscription.plan = plan
    subscription.billing_cycle = cycle
    subscription.save(update_fields=['plan', 'billing_cycle'])

    reference = f"alphadev-{store.slug}-{cycle}-{uuid.uuid4().hex[:10]}"

    if not settings.PAYSTACK_SECRET_KEY:
        # Demo mode — no live Paystack key configured yet. Simulate the
        # checkout with a real two-step confirm screen instead of a live
        # charge, so the publish flow can be tested end to end.
        PaymentLog.objects.create(
            subscription=subscription, reference=reference, amount=amount, billing_cycle=cycle, raw_response={'demo': True},
        )
        return redirect('billing:demo_confirm', store_slug=store.slug)

    callback_url = request.build_absolute_uri(reverse('billing:payment_callback'))

    result = paystack.initialize_transaction(
        email=request.user.email, amount_naira=amount, reference=reference, callback_url=callback_url,
    )

    PaymentLog.objects.create(subscription=subscription, reference=reference, amount=amount, billing_cycle=cycle, raw_response=result)

    if not result.get('status'):
        messages.warning(
            request,
            "Payments aren't connected yet — Alpha Dev needs to add a live Paystack key. "
            "We'll message you to confirm payment and activate your store manually in the meantime.",
        )
        return redirect('stores:dashboard', store_slug=store.slug)

    return redirect(result['data']['authorization_url'])


@login_required
def demo_confirm(request, store_slug):
    """Stand-in for Paystack's hosted checkout while no live key is
    configured — shows a real confirm screen so the publish flow can be
    tested and demoed without moving real money."""
    store = get_object_or_404(Store, slug=store_slug, owner=request.user)
    if settings.PAYSTACK_SECRET_KEY:
        raise Http404

    subscription = store.subscription_or_none
    if not subscription:
        return redirect('billing:choose_plan', store_slug=store.slug)

    log = subscription.payments.filter(status='pending').order_by('-created_at').first()
    if not log:
        return redirect('billing:choose_plan', store_slug=store.slug)

    if request.method == 'POST':
        log.status = 'success'
        log.save(update_fields=['status'])

        days = Subscription.PERIOD_DAYS[log.billing_cycle]
        subscription.mark_active(period_end=timezone.now() + timezone.timedelta(days=days))

        store.is_published = True
        store.save(update_fields=['is_published'])

        messages.success(request, 'Payment confirmed. Your store is live.')
        return redirect('stores:dashboard', store_slug=store.slug)

    return render(request, 'billing/demo_confirm.html', {'store': store, 'plan': subscription.plan, 'log': log})


@login_required
def payment_callback(request):
    reference = request.GET.get('reference')
    log = get_object_or_404(PaymentLog, reference=reference)
    result = paystack.verify_transaction(reference)

    if result.get('status') and result.get('data', {}).get('status') == 'success':
        log.status = 'success'
        log.raw_response = result
        log.save(update_fields=['status', 'raw_response'])

        subscription = log.subscription
        days = Subscription.PERIOD_DAYS[log.billing_cycle]
        subscription.mark_active(period_end=timezone.now() + timezone.timedelta(days=days))

        store = subscription.store
        store.is_published = True
        store.save(update_fields=['is_published'])

        messages.success(request, 'Payment confirmed. Your store is live.')
        return redirect('stores:dashboard', store_slug=store.slug)
    else:
        log.status = 'failed'
        log.raw_response = result
        log.save(update_fields=['status', 'raw_response'])
        messages.error(request, 'Payment could not be confirmed. Please try again or contact us.')

    return redirect('stores:dashboard', store_slug=log.subscription.store.slug)


@csrf_exempt
def paystack_webhook(request):
    """Handles recurring-charge events from Paystack. Verifies the request
    signature before trusting anything in the payload."""
    if request.method != 'POST':
        return HttpResponseForbidden()

    signature = request.headers.get('x-paystack-signature', '')
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode('utf-8'), request.body, hashlib.sha512,
    ).hexdigest()

    if not settings.PAYSTACK_SECRET_KEY or not hmac.compare_digest(signature, expected):
        return HttpResponseForbidden()

    event = json.loads(request.body)
    event_type = event.get('event', '')
    data = event.get('data', {})

    if event_type == 'charge.success':
        reference = data.get('reference', '')
        log = PaymentLog.objects.filter(reference=reference).first()
        if log:
            log.status = 'success'
            log.raw_response = event
            log.save(update_fields=['status', 'raw_response'])
            days = Subscription.PERIOD_DAYS[log.billing_cycle]
            log.subscription.mark_active(period_end=timezone.now() + timezone.timedelta(days=days))

    elif event_type in ('subscription.disable', 'invoice.payment_failed'):
        sub_code = data.get('subscription_code', '')
        sub = Subscription.objects.filter(paystack_subscription_code=sub_code).first()
        if sub:
            sub.mark_past_due()

    return HttpResponse(status=200)
