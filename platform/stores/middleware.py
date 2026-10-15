from django.utils import timezone


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
