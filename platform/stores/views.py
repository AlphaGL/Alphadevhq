from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core import signing
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.text import slugify

from .forms import SocialLinkForm, StoreDetailsForm, StoreImageForm, TemplatePickForm, ThemeCustomizeForm
from .models import (
    CATEGORY_CHOICES, SECTION_TYPES, TEMPLATE_CATEGORY_CHOICES,
    SocialLink, Store, StoreImage, StoreSection, StoreTemplate,
)

PREVIEW_SALT = 'alphadev-store-preview'
PREVIEW_MAX_AGE = 120  # 2 minutes — matches the "changing every 2 mins" ask


def make_preview_token(store):
    return signing.dumps(store.pk, salt=PREVIEW_SALT)


def agency_home(request):
    """The real homepage — the full Alpha Dev agency marketing site."""
    return render(request, 'stores/agency_home.html')


def store_landing(request):
    """Landing page for the Alpha Dev Stores product, reached from a CTA
    on the agency homepage. Leads with the slug-availability hook."""
    templates = StoreTemplate.objects.filter(is_active=True, tier='single').order_by('category', 'order')
    from billing.models import Plan
    plans = Plan.objects.all()
    return render(request, 'stores/store_landing.html', {'templates': templates, 'plans': plans})


def slug_check(request):
    name = request.GET.get('name', '').strip()
    if not name:
        return JsonResponse({'available': None, 'slug': ''})
    slug = slugify(name)[:140] or ''
    available = bool(slug) and not Store.objects.filter(slug=slug).exists()
    return JsonResponse({'available': available, 'slug': slug})


def require_verified(view_func):
    @wraps(view_func)
    @login_required
    def wrapper(request, *args, **kwargs):
        if not request.user.profile.is_verified:
            messages.warning(request, 'Please verify your account first.')
            return redirect('accounts:verify')
        return view_func(request, *args, **kwargs)
    return wrapper


def _get_store(request, store_slug):
    return get_object_or_404(Store, slug=store_slug, owner=request.user)


@login_required
def store_list(request):
    """An account can own more than one store (e.g. separate businesses),
    each billed and published independently. Zero stores sends you straight
    into building the first one; exactly one skips the picker entirely."""
    stores = Store.objects.filter(owner=request.user).order_by('-created_at')
    if not stores.exists():
        return redirect('stores:builder_new')
    if stores.count() == 1:
        return redirect('stores:dashboard', store_slug=stores.first().slug)
    return render(request, 'stores/store_list.html', {'stores': stores})


@login_required
def dashboard(request, store_slug):
    store = _get_store(request, store_slug)
    sub = store.subscription_or_none
    return render(request, 'stores/dashboard.html', {
        'store': store,
        'subscription': sub,
        'visits_today': store.visits_today(),
        'near_cap': store.is_near_traffic_cap,
        'preview_token': make_preview_token(store),
        'preview_minutes': PREVIEW_MAX_AGE // 60,
    })


@require_verified
def builder_theme(request, store_slug=None):
    """Pick a template. With no store_slug this starts a brand-new store
    (first one, or an extra one); with a store_slug it switches that
    existing store's template instead of creating another."""
    store = _get_store(request, store_slug) if store_slug else None
    templates = StoreTemplate.objects.filter(is_active=True)
    selected_category = request.GET.get('category', '')
    if selected_category:
        templates = templates.filter(category=selected_category)

    if request.method == 'POST':
        form = TemplatePickForm(request.POST)
        if form.is_valid():
            picked = form.cleaned_data['template']
            if not store:
                business_name = request.session.pop('pending_business_name', request.user.email)
                store = Store.objects.create(owner=request.user, business_name=business_name)
                StoreSection.seed_defaults(store)
            store.template = picked
            store.theme_color = picked.accent_color
            update_fields = ['template', 'theme_color']

            # First pick (or a template switch before any real edit): fill the
            # page with the template's own example copy so it looks like a
            # finished site immediately, instead of an empty shell.
            if not store.has_customized_content:
                if picked.example_tagline:
                    store.tagline = picked.example_tagline
                    update_fields.append('tagline')
                if picked.example_bio:
                    store.bio = picked.example_bio
                    update_fields.append('bio')
                if picked.example_services:
                    services_section = store.sections.filter(section_type='services').first()
                    if services_section:
                        services_section.body = picked.example_services
                        services_section.save(update_fields=['body'])

            store.save(update_fields=update_fields)
            return redirect('stores:builder_details', store_slug=store.slug)
    else:
        initial_template_id = store.template_id if store else None
        requested_slug = request.GET.get('template')
        if requested_slug:
            requested = StoreTemplate.objects.filter(slug=requested_slug, is_active=True).first()
            if requested:
                initial_template_id = requested.id
        form = TemplatePickForm(initial={'template': initial_template_id})

    self_url = reverse('stores:builder_theme', args=[store.slug]) if store else reverse('stores:builder_new')
    return render(request, 'stores/builder_theme.html', {
        'form': form, 'templates': templates, 'store': store,
        'self_url': self_url,
        'selected_template_id': form.initial.get('template'),
        'categories': StoreTemplate._meta.get_field('category').choices,
        'selected_category': selected_category,
    })


@require_verified
def builder_details(request, store_slug):
    store = _get_store(request, store_slug)

    if request.method == 'POST':
        form = StoreDetailsForm(request.POST, request.FILES, instance=store)
        theme_form = ThemeCustomizeForm(request.POST, instance=store)
        if form.is_valid() and theme_form.is_valid():
            tpl = store.template
            edited_example_copy = tpl and (
                form.cleaned_data.get('tagline') != tpl.example_tagline
                or form.cleaned_data.get('bio') != tpl.example_bio
            )
            form.save()
            theme_form.save()
            if edited_example_copy and not store.has_customized_content:
                store.has_customized_content = True
                store.save(update_fields=['has_customized_content'])
            messages.success(request, 'Store details saved.')
            return redirect('stores:builder_sections', store_slug=store.slug)
    else:
        form = StoreDetailsForm(instance=store)
        theme_form = ThemeCustomizeForm(instance=store)

    return render(request, 'stores/builder_details.html', {'form': form, 'theme_form': theme_form, 'store': store})


@require_verified
def builder_sections(request, store_slug):
    store = _get_store(request, store_slug)

    if request.method == 'POST':
        tpl = store.template
        enabled_ids = set(request.POST.getlist('enabled'))
        edited_example_copy = False
        for section in store.sections.all():
            section.is_enabled = str(section.id) in enabled_ids
            section.heading_override = request.POST.get(f'heading_{section.id}', '').strip()
            new_body = request.POST.get(f'body_{section.id}', '').strip()
            if (
                tpl and section.section_type == 'services'
                and new_body != tpl.example_services and new_body != section.body
            ):
                edited_example_copy = True
            section.body = new_body
            section.save(update_fields=['is_enabled', 'heading_override', 'body'])
        if edited_example_copy and not store.has_customized_content:
            store.has_customized_content = True
            store.save(update_fields=['has_customized_content'])
        messages.success(request, 'Sections updated.')
        return redirect('stores:builder_images', store_slug=store.slug)

    return render(request, 'stores/builder_sections.html', {'store': store, 'sections': store.sections.all()})


@require_verified
def move_section(request, store_slug, section_id, direction):
    store = _get_store(request, store_slug)
    section = get_object_or_404(StoreSection, pk=section_id, store=store)
    sections = list(store.sections.all())
    idx = next(i for i, s in enumerate(sections) if s.id == section.id)

    swap_idx = idx - 1 if direction == 'up' else idx + 1
    if 0 <= swap_idx < len(sections):
        other = sections[swap_idx]
        section.order, other.order = other.order, section.order
        section.save(update_fields=['order'])
        other.save(update_fields=['order'])

    return redirect('stores:builder_sections', store_slug=store.slug)


@require_verified
def builder_images(request, store_slug):
    store = _get_store(request, store_slug)

    if request.method == 'POST':
        if not store.can_add_image:
            messages.error(request, f'Your plan allows up to {store.image_limit} images. Upgrade to add more.')
            return redirect('stores:builder_images', store_slug=store.slug)
        form = StoreImageForm(request.POST, request.FILES)
        if form.is_valid():
            image = form.save(commit=False)
            image.store = store
            image.order = store.image_count
            image.save()
            messages.success(request, 'Image added.')
            return redirect('stores:builder_images', store_slug=store.slug)
    else:
        form = StoreImageForm()

    return render(request, 'stores/builder_images.html', {
        'store': store, 'form': form, 'images': store.images.all(),
    })


@require_verified
def delete_image(request, store_slug, image_id):
    store = _get_store(request, store_slug)
    StoreImage.objects.filter(pk=image_id, store=store).delete()
    return redirect('stores:builder_images', store_slug=store.slug)


@require_verified
def builder_socials(request, store_slug):
    store = _get_store(request, store_slug)

    if request.method == 'POST':
        form = SocialLinkForm(request.POST)
        if form.is_valid():
            link, _ = SocialLink.objects.update_or_create(
                store=store, platform=form.cleaned_data['platform'],
                defaults={'url': form.cleaned_data['url']},
            )
            messages.success(request, 'Social link saved.')
            return redirect('stores:builder_socials', store_slug=store.slug)
    else:
        form = SocialLinkForm()

    return render(request, 'stores/builder_socials.html', {
        'store': store, 'form': form, 'links': store.social_links.all(),
    })


@require_verified
def delete_social(request, store_slug, link_id):
    store = _get_store(request, store_slug)
    SocialLink.objects.filter(pk=link_id, store=store).delete()
    return redirect('stores:builder_socials', store_slug=store.slug)


def explore(request):
    stores = Store.objects.filter(is_published=True, is_approved=True)
    stores = [s for s in stores if s.is_live]

    category = request.GET.get('category', '')
    if category:
        stores = [s for s in stores if s.category == category]

    stores.sort(key=lambda s: (not s.is_featured, s.business_name.lower()))

    return render(request, 'stores/explore.html', {
        'stores': stores,
        'categories': CATEGORY_CHOICES,
        'selected_category': category,
    })


def _store_template_name(store):
    if store.template and store.template.layout_key:
        return f'store_templates/{store.template.layout_key}.html'
    return 'stores/public_store.html'


class _DemoStore:
    """Unsaved, template-only stand-in for Store, used solely so the public
    template demo never touches the database — any number of visitors can
    preview the same template at once with zero write cost, and nothing
    they do here can affect a real owner's store or the shared template."""
    def __init__(self, tpl):
        self.business_name = 'Your Business Name'
        self.tagline = tpl.example_tagline
        self.bio = tpl.example_bio
        self.logo = None
        self.address = ''
        self.hours = ''
        self.whatsapp_url = '#'
        self._category_label = dict(TEMPLATE_CATEGORY_CHOICES).get(tpl.category, '')

    def get_category_display(self):
        return self._category_label


class _DemoSection:
    def __init__(self, section_type, body=''):
        self.section_type = section_type
        self.body = body
        self.is_enabled = True
        self.order = 0

    def get_heading(self):
        return dict(SECTION_TYPES).get(self.section_type, '')


class _DemoSocialLink:
    def get_platform_display(self):
        return 'Instagram'
    url = '#'


def template_preview(request, slug):
    """Public, unauthenticated demo of a template filled with its own
    example copy — lets a visitor judge the real design before claiming it.
    Renders straight from StoreTemplate; creates nothing in the database."""
    tpl = get_object_or_404(StoreTemplate, slug=slug, is_active=True)
    demo_store = _DemoStore(tpl)
    sections = [
        _DemoSection('about'),
        _DemoSection('services', body=tpl.example_services),
        _DemoSection('socials'),
        _DemoSection('contact'),
    ]
    use_template_url = f"{reverse('stores:builder_new')}?template={tpl.slug}"
    # ?clean=1 hides the demo banner/watermark — used only by our own
    # screenshot tooling to generate the gallery thumbnail image.
    return render(request, f'store_templates/{tpl.layout_key}.html', {
        'store': demo_store,
        'sections': sections,
        'images': [],
        'social_links': [_DemoSocialLink()],
        'is_template_demo': not request.GET.get('clean'),
        'use_template_url': use_template_url,
        'template': tpl,
    })


def preview_store(request, token):
    """Temporary watermarked preview of a store, valid for PREVIEW_MAX_AGE
    seconds from when the link was generated — lets an owner see their page
    before paying to publish, without it working as a permanent free link."""
    try:
        store_id = signing.loads(token, salt=PREVIEW_SALT, max_age=PREVIEW_MAX_AGE)
    except signing.SignatureExpired:
        return render(request, 'stores/preview_expired.html')
    except signing.BadSignature:
        raise Http404

    store = get_object_or_404(Store, pk=store_id)
    sections = store.sections.filter(is_enabled=True).order_by('order')
    return render(request, _store_template_name(store), {
        'store': store,
        'sections': sections,
        'images': store.images.all(),
        'social_links': store.social_links.all(),
        'is_preview': True,
    })


def public_store(request, slug):
    store = get_object_or_404(Store, slug=slug)

    if not store.is_live:
        sub = store.subscription_or_none
        if sub and sub.status == sub.PAST_DUE and not sub.is_live:
            return render(request, 'stores/store_paused.html', {'store': store}, status=200)
        if not store.is_published:
            return render(request, 'stores/store_not_live.html', {'store': store}, status=200)
        return render(request, 'stores/store_paused.html', {'store': store}, status=200)

    # Tag the request so the visit-counting middleware records this hit.
    request._store_for_visit_count = store

    sections = store.sections.filter(is_enabled=True).order_by('order')
    return render(request, _store_template_name(store), {
        'store': store,
        'sections': sections,
        'images': store.images.all(),
        'social_links': store.social_links.all(),
    })
