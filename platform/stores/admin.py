from django.contrib import admin

from .models import DailyVisit, SocialLink, Store, StoreImage, StoreSection, StoreTemplate


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
    list_display = ('business_name', 'slug', 'owner', 'category', 'is_published', 'is_approved', 'is_featured', 'image_count', 'created_at')
    list_filter = ('category', 'is_published', 'is_approved', 'is_featured')
    search_fields = ('business_name', 'slug', 'owner__username')
    prepopulated_fields = {'slug': ('business_name',)}
    actions = ['approve_stores', 'unapprove_stores', 'feature_stores', 'unfeature_stores']
    inlines = [StoreSectionInline, StoreImageInline, SocialLinkInline]

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
