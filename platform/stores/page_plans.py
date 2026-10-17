"""How a store's content is split across real public pages, driven by the
owner's plan rather than a separate template per tier. One page_limit value
maps to one fixed shape; template files render whichever shape applies by
filtering the same StoreSection rows the single-page view already uses."""

# Each entry: (slug, label, [section_types shown on that page]).
# 'hero' isn't a real section_type (it renders unconditionally from store
# fields, not a StoreSection row) — it always sits at the top of the first
# page in a plan, so it's never listed here.

THREE_PAGE_PLAN = [
    ('home', 'Home', ['team']),
    ('services', 'Services', ['services']),
    ('about', 'About & Contact', ['about', 'gallery', 'hours_location', 'socials', 'contact']),
]

SIX_PAGE_PLAN = [
    ('home', 'Home', []),
    ('services', 'Services', ['services']),
    ('about', 'About', ['about']),
    ('team', 'Team', ['team']),
    ('gallery', 'Gallery', ['gallery']),
    ('contact', 'Contact', ['hours_location', 'socials', 'contact']),
]


def page_plan_for(page_limit):
    """None for single-page stores; otherwise a list of
    {'slug', 'label', 'section_types'} dicts, home page first."""
    if page_limit >= 6:
        raw = SIX_PAGE_PLAN
    elif page_limit >= 3:
        raw = THREE_PAGE_PLAN
    else:
        return None
    return [{'slug': slug, 'label': label, 'section_types': types} for slug, label, types in raw]


def page_plan_summary(page_limit):
    """A short human label for the current plan's page shape, for upsell
    copy in the editor ('1 page' / '3 pages: Home, Services, About & Contact')."""
    plan = page_plan_for(page_limit)
    if not plan:
        return '1 page'
    labels = ', '.join(p['label'] for p in plan)
    return f"{len(plan)} pages: {labels}"


def next_page_upgrade(store):
    """The next billing Plan that would give this store more real pages
    than it has now, or None if it's already on the top tier (or there's
    nothing bigger to offer). Used to drive the editor's upgrade prompt."""
    from billing.models import Plan
    next_plan = (
        Plan.objects.filter(page_limit__gt=store.page_limit)
        .order_by('page_limit')
        .first()
    )
    if not next_plan:
        return None
    current_summary = page_plan_summary(store.page_limit)
    next_plan_obj = page_plan_for(next_plan.page_limit)
    next_summary = ', '.join(p['label'] for p in next_plan_obj) if next_plan_obj else f"{next_plan.page_limit} pages"
    return {
        'plan': next_plan,
        'current_summary': current_summary,
        'next_summary': next_summary,
    }
