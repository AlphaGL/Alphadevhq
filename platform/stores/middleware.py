from django.conf import settings
from django.utils import timezone


class StoreDomainMiddleware:
    """Lets a store be reached on its own domain instead of
    alphadevhq.com/slug/ — either a subdomain we control (<slug>.alphadevhq.com,
    a free perk on Business/Pro, works the moment DNS for alphadevhq.com
    itself is wired up, no per-store setup needed) or a custom domain a
    customer already owns and has pointed at us by hand (store.custom_domain,
    set manually in the admin once their DNS is live) — available on every
    paying tier, including Starter, since it costs us one field edit per
    customer regardless of what they're paying.

    Works by rewriting path_info to the normal /<slug>/... URL before
    Django resolves it — same trick behind most "custom domain per tenant"
    Django setups, no separate URLconf needed."""

    OWN_HOSTS = {'127.0.0.1', 'localhost', 'testserver'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0].lower().rstrip('.')
        platform_domain = settings.PLATFORM_DOMAIN.lower()
        own_hosts = self.OWN_HOSTS | {platform_domain, f'www.{platform_domain}', 'alphadevhq.vercel.app'}

        if host not in own_hosts:
            store = self._resolve_store(host, platform_domain)
            if store:
                suffix = request.path_info if request.path_info != '/' else ''
                request.path_info = f'/{store.slug}{suffix}' if suffix else f'/{store.slug}/'

        return self.get_response(request)

    def _resolve_store(self, host, platform_domain):
        from .models import Store

        suffix = f'.{platform_domain}'
        if host.endswith(suffix):
            store = Store.objects.filter(slug=host[: -len(suffix)], external_url='').first()
        else:
            store = Store.objects.filter(custom_domain__iexact=host).first()

        # Any existing store is routed, live or not, so a lapsed/unpublished
        # store shows its own paused page rather than the Alpha Dev homepage.
        return store


class StoreVisitMiddleware:
    """Counts a visit per store per day, for the traffic soft-cap banner.
    The view itself tags request._store_for_visit_count; this just persists it
    after the response is built so a failed render never gets counted."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        store = getattr(request, '_store_for_visit_count', None)
        if store is not None and response.status_code == 200:
            from .models import DailyVisit
            today = timezone.localdate()
            visit, _ = DailyVisit.objects.get_or_create(store=store, date=today)
            DailyVisit.objects.filter(pk=visit.pk).update(count=visit.count + 1)

        return response
