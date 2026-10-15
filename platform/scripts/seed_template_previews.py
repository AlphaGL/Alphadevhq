"""Creates one sample store per StoreTemplate with realistic placeholder
content, for visually testing / generating gallery preview screenshots.
Run with: python manage.py shell < scripts/seed_template_previews.py
"""
from django.contrib.auth.models import User
from django.utils import timezone
from billing.models import Plan, Subscription
from stores.models import Store, StoreSection, StoreTemplate, SocialLink

SAMPLES = {
    'business-pro': dict(
        business_name='CrestCare Clinic', category='clinic',
        tagline='Trusted diagnostic and family care in Owerri',
        bio='CrestCare Clinic has served Owerri families for over a decade with modern diagnostic equipment and a calm, professional team.',
        services='General consultations — walk-in or by appointment [Consultations]\nLab diagnostics and screening — same-day results [Diagnostics]\nMinor procedures — outpatient [Procedures]\nFamily health plans — monthly [Plans]',
        address='14 Wetheral Road, Owerri', hours='Mon-Sat, 8am-7pm',
        phone='2348011110001',
    ),
    'salon-bold': dict(
        business_name='Noire Studio', category='salon',
        tagline='Bridal glam and signature looks, Owerri',
        bio='Noire Studio is where brides and everyday glam come together. Every look is tailored to you, never off the shelf.',
        services='Bridal makeup — from 45,000 [Bridal]\nOwanbe glam — from 25,000 [Glam]\nGele styling — from 10,000 [Hair]\nTrial session — from 15,000 [Bridal]',
        address='Egbu Road, Owerri', hours='Tue-Sun, 9am-8pm',
        phone='2348011110002',
    ),
    'bakery-warm': dict(
        business_name='Sugar & Crumb', category='bakery',
        tagline='Fresh cakes and pastries, baked daily',
        bio='Sugar & Crumb bakes every order fresh, using real butter and no shortcuts. From birthdays to weddings, we have a cake for it.',
        services='Classic vanilla cake — 8-inch [Cakes]\nRed velvet cake — 8-inch [Cakes]\nChocolate fudge cake — 8-inch [Cakes]\nCustom celebration cakes — by request [Custom]',
        address='Wetheral Road, Owerri', hours='Mon-Sat, 9am-6pm',
        phone='2348011110003',
    ),
    'portfolio-editorial': dict(
        business_name='Tega Alade', category='portfolio',
        tagline='Photographer, Lagos & beyond',
        bio='I shoot portraits, brands and weddings with a focus on honest light and real moments, not staged perfection.',
        services='Portrait sessions — studio or on-location [Portraits]\nBrand and product photography — for small businesses [Brand]\nWedding coverage — full day [Weddings]\nPrint and album design — add-on [Add-on]',
        address='Lagos, Nigeria', hours='By appointment',
        phone='2348011110004',
    ),
}

owner, _ = User.objects.get_or_create(username='template_preview_owner', defaults={'email': 'previewowner@example.com'})

for slug, data in SAMPLES.items():
    tpl = StoreTemplate.objects.get(slug=slug)
    store_slug = f'preview-{slug}'
    Store.objects.filter(slug=store_slug).delete()
    store = Store.objects.create(
        owner=owner, slug=store_slug,
        business_name=data['business_name'], category=data['category'],
        tagline=data['tagline'], bio=data['bio'],
        phone=data['phone'], address=data['address'], hours=data['hours'],
        template=tpl, theme_color=tpl.accent_color,
        is_published=True, is_approved=True,
    )
    StoreSection.seed_defaults(store)
    services_section = store.sections.get(section_type='services')
    services_section.body = data['services']
    services_section.save()
    SocialLink.objects.get_or_create(store=store, platform='instagram', defaults={'url': 'https://instagram.com/example'})

    plan = Plan.objects.get(slug='starter')
    sub, _ = Subscription.objects.get_or_create(store=store, defaults={'plan': plan})
    sub.mark_active(period_end=timezone.now() + timezone.timedelta(days=30))
    print(f'Created {store.slug} using template {tpl.slug}')

print('DONE')
