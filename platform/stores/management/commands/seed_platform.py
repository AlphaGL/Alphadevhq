from django.core.management.base import BaseCommand

from billing.models import Plan
from stores.models import StoreTemplate


class Command(BaseCommand):
    help = "Seed starter page templates and pricing plans for Alpha Dev Stores."

    def handle(self, *args, **kwargs):
        templates = [
            dict(
                name='Healthcare & Clinics', slug='cardiocare', category='medical', tier='single',
                layout_key='medical+healthcare/cardiocare/cardiocare', accent_color='#DC2626',
                description='Bold, animated layout for clinics, hospitals and specialist practices.',
                order=0,
                example_tagline='Expert, compassionate care for every patient, every time',
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
                example_team=(
                    'Dr. Amaka Obi — Family Medicine\n'
                    'Dr. Chidi Nwosu — Paediatrics\n'
                    'Dr. Ifeoma Eze — Internal Medicine'
                ),
            ),
            dict(
                name='Prime Dental', slug='primedental', category='medical', tier='single',
                layout_key='medical+healthcare/primedental/primedental', accent_color='#4B3DF2',
                description='Friendly, modern purple-gradient layout for dental and specialist clinics.',
                order=1,
                example_tagline='Professional & modern dental care for the whole family',
                example_bio=(
                    'High-quality treatments, advanced technology and a caring team — helping patients '
                    'achieve a healthy, confident smile. Replace this with your own story — how the '
                    'practice started and what patients can expect when they walk in.'
                ),
                example_services=(
                    'Cosmetic dentistry — veneers, whitening & smile design [Popular]\n'
                    'Orthodontics — braces and aligners for all ages [Popular]\n'
                    'Oral hygiene — routine cleaning & checkups [Preventive]\n'
                    'Dental implants — permanent tooth replacement [Specialist]'
                ),
                example_team=(
                    'Dr. Farah Hassan — General Dentistry\n'
                    'Dr. Tunde Bakare — Orthodontics\n'
                    'Dr. Sarah Lin — Cosmetic Dentistry'
                ),
            ),
            dict(
                name='Business & Professional', slug='business-pro', category='business', tier='single',
                layout_key='business_pro', accent_color='#0B2E4F',
                description='Clean, trustworthy layout for consultants and professional services.',
                order=2,
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
                name='Business', slug='business', tier=Plan.BUSINESS, price=3500,
                image_limit=15, page_limit=3,
                description='For a business ready to show more: real pages, more photos.',
                features=[
                    'Everything in Starter',
                    'Up to 3 pages (Home, Services, About & Contact)',
                    'Up to 15 images',
                    'Priority support',
                ],
                order=1,
            ),
            dict(
                name='Pro', slug='pro', tier=Plan.PRO, price=6500,
                image_limit=25, page_limit=6,
                description='The full site: every section as its own page, room for a lot more photos.',
                features=[
                    'Everything in Business',
                    'Up to 6 pages (Home, Services, About, Team, Gallery, Contact)',
                    'Up to 25 images',
                    'Priority support',
                    'Custom domain connection (yourbusiness.com) — coming soon',
                ],
                order=2,
            ),
        ]
        for data in plans:
            Plan.objects.update_or_create(slug=data['slug'], defaults=data)
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(plans)} plans.'))
