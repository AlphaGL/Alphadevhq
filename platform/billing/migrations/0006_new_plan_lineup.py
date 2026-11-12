"""Moves to the Free / Starter / Pro / Business lineup.

Existing subscribers are moved up, never down:
  old Starter  (N3,500, 1 page)  -> new Starter
  old Business (N5,000, 3 pages) -> new Pro
  old Pro      (N10,000, 6 pages) -> new Business

Prices changed, so every paid plan's Paystack codes are cleared:
`sync_paystack_plans` then creates new Paystack plans at the new prices,
while anyone already subscribed keeps being charged on their old Paystack
plan (their old price).
"""
from django.db import migrations

PLANS = [
    dict(
        tier='free', slug='free', name='Free', price=0, order=0,
        image_limit=5, page_limit=1, allows_custom_domain=False,
        description='Get found online',
        features=[
            'Your own web address: yourname.alphadevhq.com',
            'A one-page site in any design',
            'Up to 5 photos',
            'WhatsApp and call buttons',
            'Customer star reviews',
            'Listed in Find a Business',
        ],
    ),
    dict(
        tier='starter', slug='starter', name='Starter', price=3000, order=1,
        image_limit=20, page_limit=3, allows_custom_domain=False,
        description='Look professional',
        features=[
            'Everything in Free',
            'No "Made with Alpha Dev" badge',
            '3 pages: Home, Services, About & Contact',
            'Up to 20 photos',
            'See how many people visit, every day',
        ],
    ),
    dict(
        tier='pro', slug='pro', name='Pro', price=7500, order=2,
        image_limit=50, page_limit=6, allows_custom_domain=True,
        description='Stand out and grow',
        features=[
            'Everything in Starter',
            '6 pages: Home, Services, About, Team, Gallery, Contact',
            'Up to 50 photos',
            'Use your own .com address',
            'Shown higher in Find a Business',
        ],
    ),
    dict(
        tier='business', slug='business', name='Business', price=15000, order=3,
        image_limit=100, page_limit=6, allows_custom_domain=True,
        description='We do it for you',
        features=[
            'Everything in Pro',
            'Our team sets up your site for you',
            'Up to 100 photos',
            'Top of your category in Find a Business',
            'Priority WhatsApp support',
            'A monthly visitor report',
        ],
    ),
]


def forwards(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Subscription = apps.get_model('billing', 'Subscription')

    # Remember who was on which old plan before the rows are repurposed.
    old_business = list(Subscription.objects.filter(plan__tier='business').values_list('pk', flat=True))
    old_pro = list(Subscription.objects.filter(plan__tier='pro').values_list('pk', flat=True))

    rows = {}
    for data in PLANS:
        defaults = {k: v for k, v in data.items() if k != 'tier'}
        defaults.update(paystack_plan_code_monthly='', paystack_plan_code_annual='')
        # Free a slug that another tier's row is still holding.
        Plan.objects.filter(slug=data['slug']).exclude(tier=data['tier']).update(slug=f"old-{data['slug']}")
        plan, _ = Plan.objects.update_or_create(tier=data['tier'], defaults=defaults)
        rows[data['tier']] = plan

    Subscription.objects.filter(pk__in=old_business).update(plan=rows['pro'])
    Subscription.objects.filter(pk__in=old_pro).update(plan=rows['business'])


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0005_free_tier_and_custom_domain_flag'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
