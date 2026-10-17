from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core import signing
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.text import slugify

from .forms import TemplatePickForm
from .models import (
    CATEGORY_CHOICES, SECTION_TYPES, SOCIAL_PLATFORMS, TEMPLATE_CATEGORY_CHOICES,
    SocialLink, Store, StoreImage, StoreSection, StoreTemplate,
)

PREVIEW_SALT = 'alphadev-store-preview'
PREVIEW_MAX_AGE = 120  # 2 minutes — matches the "changing every 2 mins" ask


def make_preview_token(store):
    return signing.dumps(store.pk, salt=PREVIEW_SALT)


def agency_home(request):
    """The real homepage — the full Alpha Dev agency marketing site."""
    from billing.models import Plan
    templates = StoreTemplate.objects.filter(is_active=True, tier='single').order_by('order')
    plans = Plan.objects.all()
    return render(request, 'stores/agency_home.html', {'templates': templates, 'plans': plans})


def privacy_policy(request):
    return render(request, 'stores/privacy_policy.html')


def terms(request):
    return render(request, 'stores/terms.html')


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
    from . import analytics
    store = _get_store(request, store_slug)
    sub = store.subscription_or_none
    health = analytics.health_check(store)
    visits_week, visits_change_pct = analytics.visits_trend(store)
    benchmark = analytics.category_benchmark(store)
    benchmark_rows = None
    if benchmark:
        benchmark_rows = [
            {'label': 'Services listed', 'data': benchmark['services']},
            {'label': 'Photos uploaded', 'data': benchmark['images']},
            {'label': 'Visits today', 'data': benchmark['visits']},
        ]
    return render(request, 'stores/dashboard.html', {
        'store': store,
        'subscription': sub,
        'visits_today': store.visits_today(),
        'visits_week': visits_week,
        'visits_change_pct': visits_change_pct,
        'visits_series': analytics.visits_series(store),
        'best_day': analytics.best_day_of_week(store),
        'near_cap': store.is_near_traffic_cap,
        'health': health,
        'benchmark': benchmark,
        'benchmark_rows': benchmark_rows,
        'renewal': analytics.renewal_status(sub),
        'milestones': analytics.milestones(store, health),
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
                if picked.example_team:
                    team_section = store.sections.filter(section_type='team').first()
                    if team_section:
                        team_section.body = picked.example_team
                        team_section.save(update_fields=['body'])

            store.save(update_fields=update_fields)
            return redirect('stores:builder_edit', store_slug=store.slug)
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


STORE_TEXT_FIELDS = {'business_name', 'tagline', 'bio', 'phone', 'address', 'hours'}
SECTION_BODY_FIELDS = {'about_body': 'about', 'services_body': 'services', 'team_body': 'team'}


def _mark_customized(store):
    if not store.has_customized_content:
        store.has_customized_content = True
        store.save(update_fields=['has_customized_content'])


@require_verified
def builder_edit(request, store_slug):
    """The whole editing experience: the real, live template rendered in
    an editable mode, so the owner edits text, logo and photos directly
    on the actual page instead of a disconnected form."""
    store = _get_store(request, store_slug)
    existing_links = {link.platform: link.url for link in store.social_links.all()}
    social_rows = [
        {'platform': key, 'label': label, 'url': existing_links.get(key, '')}
        for key, label in SOCIAL_PLATFORMS
    ]
    # Built here (not via {% url %} in the template) because the id has to
    # stay a placeholder token for JS to fill in — reverse() needs a real
    # int, so a dummy one is swapped for a token unlikely to collide with
    # anything in the slug itself.
    toggle_section_url_tpl = reverse(
        'stores:editor_toggle_section', args=[store.slug, 999999999],
    ).replace('999999999', '__ID__')
    delete_image_url_tpl = reverse(
        'stores:editor_delete_image', args=[store.slug, 999999999],
    ).replace('999999999', '__ID__')
    move_section_up_url_tpl = reverse(
        'stores:editor_move_section', args=[store.slug, 999999999, 'up'],
    ).replace('999999999', '__ID__')
    move_section_down_url_tpl = reverse(
        'stores:editor_move_section', args=[store.slug, 999999999, 'down'],
    ).replace('999999999', '__ID__')
    return render(request, _store_template_name(store), {
        'store': store,
        'sections': store.sections.all(),
        'images': store.images.all(),
        'social_links': store.social_links.all(),
        'is_editor': True,
        'editor_social_rows': social_rows,
        'preview_token': make_preview_token(store),
        'toggle_section_url_tpl': toggle_section_url_tpl,
        'move_section_up_url_tpl': move_section_up_url_tpl,
        'move_section_down_url_tpl': move_section_down_url_tpl,
        'delete_image_url_tpl': delete_image_url_tpl,
    })


@require_verified
def editor_save_field(request, store_slug):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    field = request.POST.get('field', '')
    value = request.POST.get('value', '').strip()

    if field in STORE_TEXT_FIELDS:
        setattr(store, field, value)
        store.save(update_fields=[field])
        _mark_customized(store)
        return JsonResponse({'ok': True})

    if field in SECTION_BODY_FIELDS:
        section_type = SECTION_BODY_FIELDS[field]
        section, _created = StoreSection.objects.get_or_create(
            store=store, section_type=section_type, defaults={'order': 99},
        )
        section.body = value
        section.save(update_fields=['body'])
        _mark_customized(store)
        return JsonResponse({'ok': True})

    return JsonResponse({'ok': False, 'error': 'Unknown field'}, status=400)


@require_verified
def editor_toggle_section(request, store_slug, section_id):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    section = get_object_or_404(StoreSection, pk=section_id, store=store)
    section.is_enabled = not section.is_enabled
    section.save(update_fields=['is_enabled'])
    return JsonResponse({'ok': True, 'is_enabled': section.is_enabled})


@require_verified
def editor_move_section(request, store_slug, section_id, direction):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
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

    return JsonResponse({'ok': True})


@require_verified
def editor_upload_logo(request, store_slug):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    file = request.FILES.get('logo')
    if not file:
        return JsonResponse({'ok': False, 'error': 'No file received'}, status=400)
    store.logo = file
    store.save(update_fields=['logo'])
    _mark_customized(store)
    return JsonResponse({'ok': True, 'url': store.logo.url})


@require_verified
def editor_add_image(request, store_slug):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    if not store.can_add_image:
        return JsonResponse({'ok': False, 'error': f'Your plan allows up to {store.image_limit} images.'}, status=400)
    file = request.FILES.get('image')
    if not file:
        return JsonResponse({'ok': False, 'error': 'No file received'}, status=400)
    image = StoreImage.objects.create(store=store, image=file, order=store.image_count)
    _mark_customized(store)
    return JsonResponse({'ok': True, 'id': image.id, 'url': image.image.url})


@require_verified
def editor_delete_image(request, store_slug, image_id):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    StoreImage.objects.filter(pk=image_id, store=store).delete()
    return JsonResponse({'ok': True})


@require_verified
def editor_save_social(request, store_slug):
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    store = _get_store(request, store_slug)
    platform = request.POST.get('platform', '')
    url = request.POST.get('url', '').strip()
    if platform not in dict(SOCIAL_PLATFORMS):
        return JsonResponse({'ok': False, 'error': 'Unknown platform'}, status=400)
    if url:
        SocialLink.objects.update_or_create(store=store, platform=platform, defaults={'url': url})
    else:
        SocialLink.objects.filter(store=store, platform=platform).delete()
    _mark_customized(store)
    return JsonResponse({'ok': True})


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
        self.address = 'Your business address'
        self.hours = 'Mon–Sat, 9am–6pm'
        self.phone = '2348012345678'
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


class _DemoImage:
    """Stands in for a real StoreImage in the template demo, so the gallery
    section renders — as placeholder tiles, never a fabricated photo — to
    show a visitor where their own photos will go, and how many fit."""
    caption = ''


def template_preview(request, slug):
    """Public, unauthenticated demo of a template filled with its own
    example copy — lets a visitor judge the real design before claiming it.
    Renders straight from StoreTemplate; creates nothing in the database."""
    tpl = get_object_or_404(StoreTemplate, slug=slug, is_active=True)
    demo_store = _DemoStore(tpl)
    sections = [
        _DemoSection('about'),
        _DemoSection('team', body=tpl.example_team),
        _DemoSection('services', body=tpl.example_services),
        _DemoSection('gallery'),
        _DemoSection('hours_location'),
        _DemoSection('socials'),
        _DemoSection('contact'),
    ]
    use_template_url = f"{reverse('stores:builder_new')}?template={tpl.slug}"
    from billing.models import Plan
    image_limit = Plan.objects.filter(slug='starter').values_list('image_limit', flat=True).first() or 10
    # ?clean=1 hides the demo banner/watermark — used only by our own
    # screenshot tooling to generate the gallery thumbnail image.
    return render(request, f'store_templates/{tpl.layout_key}.html', {
        'store': demo_store,
        'sections': sections,
        'images': [_DemoImage() for _ in range(min(6, image_limit))],
        'social_links': [_DemoSocialLink()],
        'is_template_demo': not request.GET.get('clean'),
        'use_template_url': use_template_url,
        'template': tpl,
        'image_limit': image_limit,
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


def _multi_page_urls(store):
    """The three real page URLs for a multi-page (Growth tier) template,
    so each page's nav can link to the others."""
    return {
        'home_url': reverse('stores:public_store', args=[store.slug]),
        'services_url': reverse('stores:public_store_page', args=[store.slug, 'services']),
        'about_url': reverse('stores:public_store_page', args=[store.slug, 'about']),
    }


def _not_live_response(request, store):
    """A response to send back if this store isn't publicly viewable right
    now, or None if it's fine to render."""
    if store.is_live:
        return None
    sub = store.subscription_or_none
    if sub and sub.status == sub.PAST_DUE and not sub.is_live:
        return render(request, 'stores/store_paused.html', {'store': store}, status=200)
    if not store.is_published:
        return render(request, 'stores/store_not_live.html', {'store': store}, status=200)
    return render(request, 'stores/store_paused.html', {'store': store}, status=200)


def public_store(request, slug):
    store = get_object_or_404(Store, slug=slug)
    not_live = _not_live_response(request, store)
    if not_live:
        return not_live

    # Tag the request so the visit-counting middleware records this hit.
    request._store_for_visit_count = store

    sections = store.sections.filter(is_enabled=True).order_by('order')
    is_multi = bool(store.template and store.template.tier == 'multi')
    context = {
        'store': store,
        'sections': sections,
        'images': store.images.all(),
        'social_links': store.social_links.all(),
    }
    if is_multi:
        context.update(_multi_page_urls(store))
        template_name = f'store_templates/{store.template.layout_key}_home.html'
    else:
        template_name = _store_template_name(store)
    return render(request, template_name, context)


def public_store_page(request, slug, page):
    if page not in ('services', 'about'):
        raise Http404
    store = get_object_or_404(Store, slug=slug)
    if not store.template or store.template.tier != 'multi':
        raise Http404
    not_live = _not_live_response(request, store)
    if not_live:
        return not_live

    request._store_for_visit_count = store

    sections = store.sections.filter(is_enabled=True).order_by('order')
    context = {
        'store': store,
        'sections': sections,
        'images': store.images.all(),
        'social_links': store.social_links.all(),
    }
    context.update(_multi_page_urls(store))
    return render(request, f'store_templates/{store.template.layout_key}_{page}.html', context)
