"""The four plans, in one place. `seed_platform` writes these to the
database; migration 0006 holds its own frozen copy, so editing this file
later never rewrites history.

Changing a paid plan's price? Clear that plan's paystack_plan_code_* fields
and re-run `manage.py sync_paystack_plans` — new Paystack plans get created
at the new price, and existing subscribers stay on their old one.

Card bullets only list what a customer gets today. Features still being
built live in the pricing page's comparison table, marked "Soon".
"""

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
