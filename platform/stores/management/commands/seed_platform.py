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
                description='For clinics, hospitals and specialist practices that want a bold, confident first impression.',
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
                description='For dental practices and specialist clinics that want a warm, welcoming feel.',
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
                name='MedCrest', slug='medcrest', category='medical', tier='single',
                layout_key='medical+healthcare/medcrest/medcrest', accent_color='#0F9D78',
                description='For clinics and hospitals with several doctors — includes a built-in doctor directory.',
                order=2,
                example_tagline='Excellence in healthcare with compassionate, accredited care',
                example_bio=(
                    'We combine modern diagnostic technology with a calm, unhurried approach to care. '
                    'Every visit starts with listening, not a rushed appointment slot. Replace this with '
                    'your own story — how the practice started and what patients can expect when they walk in.'
                ),
                example_services=(
                    'General consultations — walk-in or by appointment [Consultations]\n'
                    'Lab diagnostics and screening — same-day results [Diagnostics]\n'
                    'Minor procedures — outpatient [Procedures]\n'
                    'Family health plans — monthly [Plans]'
                ),
                example_team=(
                    'Dr. Amanda Foster — Cardiology\n'
                    'Dr. Marcus Johnson — Neurology\n'
                    'Dr. Rachel Williams — Pediatrics'
                ),
            ),
            dict(
                name='Monoline', slug='monoline', category='business', tier='single',
                layout_key='business+professional/monoline/monoline', accent_color='#FFAA17',
                description='For creative agencies, freelancers and consultants who want a bold, modern feel.',
                order=3,
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
                example_team=(
                    'Chidi Okafor — Founder & Lead Consultant\n'
                    'Amara Bello — Operations\n'
                    'Tope Adeyemi — Client Success'
                ),
            ),
            dict(
                name='VaultEdge', slug='vaultedge', category='business', tier='single',
                layout_key='business+professional/vaultedge/vaultedge', accent_color='#D4A017',
                description='For financial advisors, legal and accounting firms that want a polished, corporate feel.',
                order=4,
                example_tagline='Confident, professional service you can rely on',
                example_bio=(
                    'We combine deep expertise with a client-first approach to deliver outcomes that '
                    'consistently exceed expectations — all while keeping your interests first. Replace '
                    'this with your own story and what makes your business the right choice.'
                ),
                example_services=(
                    'Strategic planning — tailored to your goals [Popular]\n'
                    'Advisory & consulting — ongoing or one-off [Popular]\n'
                    'Risk & compliance review [Specialist]\n'
                    'Flexible retainers for returning clients [Plans]'
                ),
                example_team=(
                    'Alex Morgan — Managing Partner\n'
                    'Sarah Patel — Senior Advisor\n'
                    'James Liu — Client Relations'
                ),
            ),
            dict(
                name='Northfield', slug='northfield', category='business', tier='single',
                layout_key='business+professional/northfield/northfield', accent_color='#1F9D55',
                description='For contractors, agencies and service providers who want a clean, everyday trustworthy look.',
                order=5,
                example_tagline='Practical, reliable service you can count on',
                example_bio=(
                    'We have worked with businesses across the region to deliver dependable, '
                    'professional service without the runaround. Replace this with a sentence or two '
                    'about what makes your business the right choice.'
                ),
                example_services=(
                    'Consultation & planning — tailored to your needs [Popular]\n'
                    'Ongoing support & maintenance [Popular]\n'
                    'Project management [Specialist]\n'
                    'Flexible retainers for returning clients [Plans]'
                ),
                example_team=(
                    'Daniel Okoro — Founder\n'
                    'Grace Umeh — Client Relations\n'
                    'Femi Adewale — Operations'
                ),
            ),
            dict(
                name='Salone', slug='salone', category='ecommerce', tier='single',
                layout_key='ecommerce/salone/salone', accent_color='#F28B00',
                description='For electronics, gadget and accessory sellers who want a bold, energetic storefront.',
                order=6,
                example_tagline='Genuine electronics, unbeatable prices',
                example_bio=(
                    'We stock a wide range of genuine electronics and gadgets, sourced for quality and '
                    'priced to be fair. Replace this with your own story — what you sell and why customers '
                    'should shop with you.'
                ),
                example_services=(
                    'Wireless Earbuds — ₦18,000 [Audio]\n'
                    'Smart Watch — ₦35,000 [Wearables]\n'
                    'Power Bank 20000mAh — ₦12,000 [Accessories]\n'
                    'Bluetooth Speaker — ₦22,000 [Audio]'
                ),
                example_team=(
                    'Tunde Bakare — Store Manager\n'
                    'Chiamaka Eze — Customer Support'
                ),
            ),
            dict(
                name='Loom', slug='loom', category='ecommerce', tier='single',
                layout_key='ecommerce/loom/loom', accent_color='#8C907E',
                description='For fashion, clothing and boutique sellers who want a minimal, elevated feel.',
                order=7,
                example_tagline='Thoughtfully chosen pieces, made to last',
                example_bio=(
                    'We curate a small, considered collection — pieces we would wear ourselves. '
                    'Replace this with your own story — what you sell and why customers should shop with you.'
                ),
                example_services=(
                    'Linen Wrap Dress — ₦32,000 [Dresses]\n'
                    'Cotton Tee — ₦9,500 [Tops]\n'
                    'Woven Tote Bag — ₦18,000 [Accessories]\n'
                    'Silk Scarf — ₦14,000 [Accessories]'
                ),
                example_team=(
                    'Ngozi Adeyemi — Founder & Buyer\n'
                    'Bisi Fashola — Customer Care'
                ),
            ),
            dict(
                name='Birchwood', slug='birchwood', category='ecommerce', tier='single',
                layout_key='ecommerce/birchwood/birchwood', accent_color='#3B5D50',
                description='For furniture, home decor and handmade goods sellers who want a warm, crafted feel.',
                order=8,
                example_tagline='Furniture and decor built to live with, not around',
                example_bio=(
                    'We source and make pieces meant to last — honest materials, simple forms, built for '
                    'everyday use. Replace this with your own story — what you sell and why customers '
                    'should shop with you.'
                ),
                example_services=(
                    'Oak Dining Chair — ₦45,000 [Seating]\n'
                    'Linen Throw Pillow — ₦9,000 [Decor]\n'
                    'Walnut Side Table — ₦68,000 [Tables]\n'
                    'Woven Storage Basket — ₦15,000 [Storage]'
                ),
                example_team=(
                    'Emeka Nwachukwu — Founder & Maker\n'
                    'Funmi Alabi — Orders & Delivery'
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
