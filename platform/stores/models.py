import urllib.parse

from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils.text import slugify


TEMPLATE_CATEGORY_CHOICES = [
    ('business', 'Business & Professional'),
    ('ecommerce', 'E-commerce & Retail'),
    ('medical', 'Medical & Healthcare'),
]

# Vestigial since page count now comes from the store's plan (see
# Store.page_limit) rather than a separate catalog entry per tier — kept
# only so existing StoreTemplate rows don't need a data migration.
TEMPLATE_TIER_CHOICES = [
    ('single', 'Single page'),
    ('multi', 'Multi page'),
]


class StoreTemplate(models.Model):
    """A real, pre-designed page layout the owner picks from a gallery,
    then edits only the content of — name, logo, text, images. Each one
    renders through its own template file under templates/store_templates/."""
    name = models.CharField(max_length=80, help_text="e.g. 'Hair & Beauty — Bold'")
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=20, choices=TEMPLATE_CATEGORY_CHOICES)
    tier = models.CharField(max_length=10, choices=TEMPLATE_TIER_CHOICES, default='single')
    layout_key = models.SlugField(help_text="Matches templates/store_templates/<layout_key>.html")
    accent_color = models.CharField(max_length=7, default='#0B0B0C', help_text="This template's built-in accent colour")
    description = models.CharField(max_length=160, blank=True)
    preview_image = models.ImageField(upload_to='alphadev_stores/template_previews/', blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Shown immediately when a store first picks this template, so the page
    # looks like a real finished site from minute one instead of an empty
    # shell. The owner overwrites these with their own words directly on
    # the live page (see Store.has_customized_content).
    example_tagline = models.CharField(max_length=160, blank=True)
    example_bio = models.TextField(blank=True)
    example_services = models.TextField(blank=True, help_text="One service per line")
    example_team = models.TextField(blank=True, help_text="One team member per line: 'Name — Role'. Only used by templates with a Team section.")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


CATEGORY_CHOICES = [
    ('clinic', 'Clinic / Healthcare'),
    ('school', 'School / Daycare'),
    ('salon', 'Salon / Beauty'),
    ('bakery', 'Bakery / Food'),
    ('portfolio', 'Portfolio / Creative'),
    ('repair', 'Repair / Technical Services'),
    ('consulting', 'Consulting / Professional Services'),
    ('other', 'Other Service Business'),
]


class Store(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stores')
    business_name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    tagline = models.CharField(max_length=160, blank=True)
    bio = models.TextField(blank=True)
    logo = models.ImageField(upload_to='alphadev_stores/logos/', blank=True, null=True)

    template = models.ForeignKey(StoreTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='stores')
    theme_color = models.CharField(max_length=7, default='#0B0B0C', help_text="Accent colour override on top of the template's default")

    phone = models.CharField(max_length=20, blank=True, help_text="WhatsApp number with country code, e.g. 2348012345678")
    address = models.CharField(max_length=255, blank=True)
    hours = models.CharField(max_length=255, blank=True)

    LISTING_PRODUCT = 'product'
    LISTING_SERVICE = 'service'
    LISTING_TYPE_CHOICES = [(LISTING_PRODUCT, 'Product — I sell physical/digital goods'), (LISTING_SERVICE, 'Service — I offer a service')]
    listing_type = models.CharField(max_length=10, choices=LISTING_TYPE_CHOICES, default=LISTING_SERVICE)

    latitude = models.FloatField(null=True, blank=True, help_text="Set from the owner's device location when they save their address")
    longitude = models.FloatField(null=True, blank=True)

    external_url = models.URLField(
        blank=True,
        help_text="For a custom-built site (not built on this platform) shown in Explore as portfolio/credibility — "
                   "Explore links straight to this URL instead of an internal store page. Leave blank for a normal self-serve store.",
    )

    has_customized_content = models.BooleanField(default=False, help_text="Owner has edited the example copy at least once")
    is_published = models.BooleanField(default=False, help_text="Owner has asked to go live (still gated by an active subscription)")
    is_approved = models.BooleanField(default=False, help_text="Passed Alpha Dev's quality check to appear in the public Explore directory")
    is_featured = models.BooleanField(default=False, help_text="Paid promotion: shown first in the Explore directory")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.business_name)[:140] or 'store'
            slug = base
            n = 1
            while Store.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.business_name

    def get_public_url(self):
        return reverse('stores:public_store', kwargs={'slug': self.slug})

    def get_display_url(self):
        """Where an Explore card should link. External custom-built sites
        (no template/subscription on this platform) link straight out."""
        return self.external_url or self.get_public_url()

    @property
    def plan(self):
        sub = getattr(self, 'subscription', None)
        return sub.plan if sub else None

    @property
    def subscription_or_none(self):
        return getattr(self, 'subscription', None)

    @property
    def is_live(self):
        """Whether the public page should actually render for visitors."""
        if not self.is_published:
            return False
        sub = self.subscription_or_none
        return bool(sub and sub.is_live)

    @property
    def is_listed(self):
        """Whether this store should appear in the public Explore directory."""
        return self.is_live and self.is_approved

    @property
    def image_limit(self):
        return self.plan.image_limit if self.plan else 10

    @property
    def page_limit(self):
        return self.plan.page_limit if self.plan else 1

    @property
    def image_count(self):
        return self.images.count()

    @property
    def can_add_image(self):
        return self.image_count < self.image_limit

    @property
    def whatsapp_url(self):
        digits = ''.join(ch for ch in self.phone if ch.isdigit())
        if not digits:
            return ''
        text = f"Hi {self.business_name}, I found your store on Alpha Dev and I'd like to know more."
        return f"https://wa.me/{digits}?text={urllib.parse.quote(text)}"

    def visits_today(self):
        from django.utils import timezone
        today = timezone.localdate()
        visit = self.daily_visits.filter(date=today).first()
        return visit.count if visit else 0

    @property
    def is_near_traffic_cap(self):
        from django.conf import settings as dj_settings
        cap = getattr(dj_settings, 'DAILY_VISIT_SOFT_CAP', 5000)
        return self.visits_today() >= cap * 0.8

    @property
    def total_views(self):
        """Lifetime view count. On a list of stores, prefer annotating
        Sum('daily_visits__count') instead — this hits the DB per call."""
        return self.daily_visits.aggregate(total=models.Sum('count'))['total'] or 0

    @property
    def average_rating(self):
        return self.ratings.aggregate(avg=models.Avg('stars'))['avg']

    @property
    def rating_count(self):
        return self.ratings.count()

    @property
    def has_location(self):
        return self.latitude is not None and self.longitude is not None

    def distance_km_from(self, lat, lng):
        """Great-circle distance in km, or None if this store has no pin."""
        if not self.has_location or lat is None or lng is None:
            return None
        import math
        r = 6371.0
        phi1, phi2 = math.radians(self.latitude), math.radians(lat)
        dphi = math.radians(lat - self.latitude)
        dlambda = math.radians(lng - self.longitude)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * r * math.asin(math.sqrt(a))


SECTION_TYPES = [
    ('hero', 'Hero / Introduction'),
    ('about', 'About Us'),
    ('team', 'Our Team'),
    ('services', 'Services'),
    ('gallery', 'Gallery'),
    ('hours_location', 'Hours & Location'),
    ('socials', 'Social Links'),
    ('contact', 'Contact / WhatsApp'),
]

DEFAULT_SECTION_ORDER = ['hero', 'about', 'team', 'services', 'gallery', 'hours_location', 'socials', 'contact']


class StoreSection(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=30, choices=SECTION_TYPES)
    is_enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    heading_override = models.CharField(max_length=120, blank=True)
    body = models.TextField(blank=True, help_text="Free text used by About / Services sections")

    class Meta:
        ordering = ['order']
        unique_together = ('store', 'section_type')

    def __str__(self):
        return f"{self.store.business_name} — {self.get_section_type_display()}"

    def get_heading(self):
        return self.heading_override or self.get_section_type_display()

    @staticmethod
    def seed_defaults(store):
        for i, section_type in enumerate(DEFAULT_SECTION_ORDER):
            StoreSection.objects.get_or_create(
                store=store, section_type=section_type,
                defaults={'order': i, 'is_enabled': True},
            )


class StoreImage(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='alphadev_stores/gallery/')
    caption = models.CharField(max_length=160, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.store.business_name} image #{self.pk}"


SOCIAL_PLATFORMS = [
    ('whatsapp', 'WhatsApp'),
    ('instagram', 'Instagram'),
    ('facebook', 'Facebook'),
    ('tiktok', 'TikTok'),
    ('twitter', 'X / Twitter'),
]


class SocialLink(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='social_links')
    platform = models.CharField(max_length=20, choices=SOCIAL_PLATFORMS)
    url = models.URLField()

    class Meta:
        unique_together = ('store', 'platform')

    def __str__(self):
        return f"{self.store.business_name} — {self.get_platform_display()}"


class DailyVisit(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='daily_visits')
    date = models.DateField()
    count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('store', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.store.business_name} — {self.date}: {self.count}"


class Rating(models.Model):
    """A visitor-submitted star rating on a store's public page. Limited to
    one per browser (via a signed session key, not a user account — most
    visitors aren't signed in) to deter easy abuse without requiring login."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='ratings')
    stars = models.PositiveSmallIntegerField(choices=[(n, str(n)) for n in range(1, 6)])
    comment = models.CharField(max_length=300, blank=True)
    session_key = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('store', 'session_key')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.store.business_name} — {self.stars}★"
