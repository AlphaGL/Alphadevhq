from django.contrib import admin

from .models import DailyVisit, Rating, SocialLink, Store, StoreImage, StoreSection, StoreTemplate


class StoreSectionInline(admin.TabularInline):
    model = StoreSection
    extra = 0


class StoreImageInline(admin.TabularInline):
    model = StoreImage
    extra = 0


class SocialLinkInline(admin.TabularInline):
    model = SocialLink
    extra = 0


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'slug', 'owner', 'category', 'listing_type', 'custom_domain', 'external_url', 'is_published', 'is_approved', 'is_featured', 'image_count', 'created_at')
    list_filter = ('category', 'listing_type', 'is_published', 'is_approved', 'is_featured')
    search_fields = ('business_name', 'slug', 'owner__username', 'external_url', 'custom_domain')
    prepopulated_fields = {'slug': ('business_name',)}
    actions = ['approve_stores', 'unapprove_stores', 'feature_stores', 'unfeature_stores']
    inlines = [StoreSectionInline, StoreImageInline, SocialLinkInline]
    fieldsets = (
        (None, {'fields': ('owner', 'business_name', 'slug', 'category', 'listing_type', 'tagline', 'bio', 'logo')}),
        ('Contact & location', {'fields': ('phone', 'address', 'hours', 'latitude', 'longitude')}),
        ('Custom-built site (not on this platform)', {
            'fields': ('external_url',),
            'description': "Set this to show a site you built directly for a client in Explore as portfolio/credibility, "
                            "instead of a self-serve store. Leave blank for a normal store. Still needs Published + Approved "
                            "checked below to actually appear.",
        }),
        ('Template & plan', {'fields': ('template', 'theme_color')}),
        ('Custom domain (any paying plan)', {
            'fields': ('custom_domain',),
            'description': "Set once a paying customer's own domain DNS is pointed at us — works on any "
                            "plan, including Starter. No http:// or www — just the bare domain, "
                            "e.g. 'yourbusiness.com'. The free yourbusiness.alphadevhq.com subdomain is "
                            "the only thing still limited to Business/Pro.",
        }),
        ('Visibility', {'fields': ('is_published', 'is_approved', 'is_featured')}),
    )

    @admin.action(description="Approve selected stores for the Explore directory")
    def approve_stores(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Remove selected stores from the Explore directory")
    def unapprove_stores(self, request, queryset):
        queryset.update(is_approved=False)

    @admin.action(description="Mark selected stores as featured (paid promotion)")
    def feature_stores(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description="Unfeature selected stores")
    def unfeature_stores(self, request, queryset):
        queryset.update(is_featured=False)


@admin.register(StoreTemplate)
class StoreTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'tier', 'layout_key', 'accent_color', 'is_active', 'order')
    list_filter = ('category', 'tier', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order',)


@admin.register(DailyVisit)
class DailyVisitAdmin(admin.ModelAdmin):
    list_display = ('store', 'date', 'count')
    list_filter = ('date',)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('store', 'stars', 'comment', 'created_at')
    list_filter = ('stars',)
    search_fields = ('store__business_name', 'comment')
