"""Dashboard analytics: visit trends, a site-completeness score, anonymised
category benchmarks, milestones and a best-day insight. Pulled together in
one place so the dashboard view stays readable."""
from collections import defaultdict

from django.utils import timezone

from .models import Store
from .templatetags.store_extras import parse_services


def visits_series(store, days=14):
    """Last `days` days of visit counts, oldest first, zero-filled for days
    with no recorded visits — ready to hand straight to a line chart."""
    today = timezone.localdate()
    start = today - timezone.timedelta(days=days - 1)
    counts = {
        row['date']: row['count']
        for row in store.daily_visits.filter(date__gte=start).values('date', 'count')
    }
    series = []
    for i in range(days):
        day = start + timezone.timedelta(days=i)
        series.append({'date': day.strftime('%b %d'), 'count': counts.get(day, 0)})
    return series


def visits_trend(store):
    """(total this week, % change vs the week before) — None change when
    there's no prior week to compare against."""
    today = timezone.localdate()
    this_week_start = today - timezone.timedelta(days=6)
    prev_week_start = today - timezone.timedelta(days=13)
    rows = {
        row['date']: row['count']
        for row in store.daily_visits.filter(date__gte=prev_week_start).values('date', 'count')
    }
    this_week = sum(c for d, c in rows.items() if d >= this_week_start)
    prev_week = sum(c for d, c in rows.items() if d < this_week_start)
    if prev_week == 0:
        pct = None
    else:
        pct = round((this_week - prev_week) / prev_week * 100)
    return this_week, pct


def best_day_of_week(store, min_days=14):
    """'Friday' if there's a clear favourite day in the store's own visit
    history, else None (too little data to say anything meaningful)."""
    rows = list(store.daily_visits.values('date', 'count'))
    if len(rows) < min_days:
        return None
    totals = defaultdict(int)
    for row in rows:
        totals[row['date'].strftime('%A')] += row['count']
    if not any(totals.values()):
        return None
    return max(totals, key=totals.get)


HEALTH_CHECKLIST = [
    ('logo', 'Add a logo', lambda s: bool(s.logo)),
    ('tagline', 'Write a tagline', lambda s: bool(s.tagline.strip())),
    ('bio', 'Write your About text', lambda s: len(s.bio.strip()) >= 40),
    ('services', 'List at least 3 services', lambda s: _services_count(s) >= 3),
    ('images', 'Upload at least 3 photos', lambda s: s.image_count >= 3),
    ('social', 'Add a social link', lambda s: s.social_links.exists()),
    ('phone', 'Add your WhatsApp number', lambda s: bool(s.phone.strip())),
]


def _services_count(store):
    section = store.sections.filter(section_type='services').first()
    return len(parse_services(section.body)) if section else 0


def health_check(store):
    """Site-completeness checklist + score out of 100. Each item names what
    to fix and whether it's already done, so the dashboard can show both a
    score and a concrete next step."""
    items = []
    for key, label, check in HEALTH_CHECKLIST:
        items.append({'key': key, 'label': label, 'done': check(store)})
    done_count = sum(1 for i in items if i['done'])
    score = round(done_count / len(items) * 100)
    return {'score': score, 'items': items, 'done_count': done_count, 'total': len(items)}


def _compare(you, avg):
    """A 'you' vs 'avg' pair plus how wide each bar should be, as two
    percentages that add up to 100 — safe even when both are zero."""
    total = you + avg
    if total <= 0:
        return {'you': you, 'avg': avg, 'you_pct': 0, 'avg_pct': 0}
    return {'you': you, 'avg': avg, 'you_pct': round(you / total * 100), 'avg_pct': round(avg / total * 100)}


def category_benchmark(store):
    """How this store's content and traffic compare to other live stores in
    the same category — aggregate numbers only, never which store is ahead."""
    peers = (
        Store.objects.filter(category=store.category, is_published=True)
        .exclude(pk=store.pk)
        .select_related('subscription')
    )
    peers = [p for p in peers if p.is_live]
    if len(peers) < 3:
        return None

    peer_services = [_services_count(p) for p in peers]
    peer_images = [p.image_count for p in peers]
    peer_visits = [p.visits_today() for p in peers]

    return {
        'peer_count': len(peers),
        'services': _compare(_services_count(store), round(sum(peer_services) / len(peer_services), 1)),
        'images': _compare(store.image_count, round(sum(peer_images) / len(peer_images), 1)),
        'visits': _compare(store.visits_today(), round(sum(peer_visits) / len(peer_visits), 1)),
    }


def renewal_status(subscription):
    """A short label + urgency level for the renewal/payment countdown."""
    if not subscription:
        return None
    now = timezone.now()
    if subscription.status == subscription.ACTIVE and subscription.current_period_end:
        days_left = (subscription.current_period_end - now).days
        urgency = 'critical' if days_left <= 3 else 'warning' if days_left <= 7 else 'ok'
        return {'label': f'Renews in {max(days_left, 0)} day{"s" if days_left != 1 else ""}', 'urgency': urgency}
    if subscription.status == subscription.PAST_DUE and subscription.grace_period_end:
        days_left = (subscription.grace_period_end - now).days
        return {'label': f'Payment due — {max(days_left, 0)} day{"s" if days_left != 1 else ""} left in grace period', 'urgency': 'critical'}
    return None


def milestones(store, health):
    total_visits = sum(row['count'] for row in store.daily_visits.values('count'))
    days_live = (timezone.localdate() - store.created_at.date()).days if store.is_live else 0
    return [
        {'key': 'first_visit', 'label': 'First visitor', 'done': total_visits >= 1},
        {'key': 'ten_visits', 'label': '10 visits', 'done': total_visits >= 10},
        {'key': 'hundred_visits', 'label': '100 visits', 'done': total_visits >= 100},
        {'key': 'month_live', 'label': '30 days live', 'done': days_live >= 30},
        {'key': 'complete_profile', 'label': 'Fully set up', 'done': health['score'] == 100},
    ]
