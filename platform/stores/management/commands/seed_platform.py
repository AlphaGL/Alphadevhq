from django.core.management.base import BaseCommand

from billing.models import Plan
from stores.models import StoreTemplate


class Command(BaseCommand):
    help = "Seed starter page templates and pricing plans for Alpha Dev Stores."

    def handle(self, *args, **kwargs):
        templates = [
            dict(
                name='Healthcare & Clinics', slug='clinic-trust', category='healthcare', tier='single',
                layout_key='clinic_trust', accent_color='#0F5C56',
                description='Calm, credible layout for clinics, hospitals and private practices.',
                order=0,
                example_tagline='Trusted diagnostic and family care, close to home',
                example_bio=(
                    'For over a decade we have combined modern equipment with a calm, unhurried '
                    'approach to care. Every visit starts with listening, not a rushed ten-minute slot. '
                    'Replace this with your own story — how the practice started and what patients can '
                    'expect when they walk in.'
                ),
                example_services=(
                    'General consultations — walk-in or by appointment [Consultations]\n'
                    'Lab diagnostics and screening — same-day results [Diagnostics]\n'
                    'Minor procedures — outpatient [Procedures]\n'
                    'Family health plans — monthly [Plans]'
                ),
            ),
            dict(
                name='Business & Professional', slug='business-pro', category='business', tier='single',
                layout_key='business_pro', accent_color='#0B2E4F',
                description='Clean, trustworthy layout for consultants and professional services.',
                order=1,
                example_tagline='Trusted, professional service you can count on',
                example_bio=(
                    'We have served this community for years with reliable, professional care and '
                    'a team that treats every client like family. Replace this with a sentence or two '
                    'about what makes your business the right choice.'
                ),
                example_services=(
                    'Your first service — short description [Popular]\n'
                    'Your second service — short description [Popular]\n'
                    'Your third service — short description [Specialist]\n'
                    'Flexible plans for returning clients [Plans]'
                ),
            ),
            dict(
                name='Salon & Beauty', slug='salon-bold', category='salon', tier='single',
                layout_key='salon_bold', accent_color='#B8860B',
                description='Bold, image-led layout for hair, makeup and beauty studios.',
                order=2,
                example_tagline='Signature looks, tailored to you',
                example_bio=(
                    'Every client leaves looking and feeling their best. We combine skill, premium '
                    'products and an eye for detail on every booking. Replace this with your own story — '
                    'what you specialise in, how long you have been doing it.'
                ),
                example_services=(
                    'Signature style — from ₦0,000 [Hair]\n'
                    'Special occasion glam — from ₦0,000 [Makeup]\n'
                    'Add-on styling — from ₦0,000 [Hair]\n'
                    'Trial session — from ₦0,000 [Makeup]'
                ),
            ),
            dict(
                name='Bakery & Food', slug='bakery-warm', category='bakery', tier='single',
                layout_key='bakery_warm', accent_color='#B45309',
                description='Warm, appetite-driving layout for bakeries, cakes and catering.',
                order=3,
                example_tagline='Fresh, made-to-order, every time',
                example_bio=(
                    'Every order is baked fresh with real ingredients and no shortcuts. From everyday '
                    'treats to celebration orders, we have something for the occasion. Replace this with '
                    'your own story — how you started, what you are known for.'
                ),
                example_services=(
                    'Signature cake or bake — short description [Cakes]\n'
                    'Seasonal or celebration specials [Specials]\n'
                    'Custom orders for events [Cakes]\n'
                    'Delivery available on request [Delivery]'
                ),
            ),
            dict(
                name='Portfolio & Creative', slug='portfolio-editorial', category='portfolio', tier='single',
                layout_key='portfolio_editorial', accent_color='#111111',
                description='Minimal, image-forward layout for photographers, designers and creatives.',
                order=4,
                example_tagline='Your craft, in one line',
                example_bio=(
                    'A short line about your focus and approach — what you shoot, design or make, and '
                    'what clients can expect from working with you. Replace this with your own words.'
                ),
                example_services=(
                    'Your main offering — short description [Featured]\n'
                    'A second offering — short description [Featured]\n'
                    'A third offering — short description [Add-on]\n'
                    'Bookings open — reach out to check availability [Booking]'
                ),
            ),
        ]
        for data in templates:
            StoreTemplate.objects.update_or_create(slug=data['slug'], defaults=data)
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(templates)} page templates.'))

        plans = [
            dict(
                name='Starter', slug='starter', tier=Plan.STARTER, price=2000,
                image_limit=10, page_limit=1,
                description='One page, everything a small service business needs to be found online.',
                features=[
                    'Single-page store',
                    'Up to 10 images',
                    'WhatsApp-first contact button',
                    'Pick a real, pre-designed template for your business',
                    'Your web address: alphadevhq.com/your-business',
                ],
                order=0,
            ),
            dict(
                name='Growth', slug='growth', tier=Plan.GROWTH, price=3500,
                image_limit=20, page_limit=3,
                description='For a business ready to show more: more pages, more photos.',
                features=[
                    'Everything in Starter',
                    'Up to 3 pages',
                    'Up to 20 images',
                    'Priority support',
                    'Custom domain connection (yourbusiness.com) — coming soon',
                ],
                order=1,
            ),
        ]
        for data in plans:
            Plan.objects.update_or_create(slug=data['slug'], defaults=data)
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(plans)} plans.'))
