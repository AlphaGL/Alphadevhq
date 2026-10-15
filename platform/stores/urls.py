from django.urls import path

from . import views

app_name = 'stores'

urlpatterns = [
    path('', views.agency_home, name='home'),
    path('get-a-store/', views.store_landing, name='store_landing'),
    path('explore/', views.explore, name='explore'),
    path('check-name/', views.slug_check, name='slug_check'),
    path('template-preview/<slug:slug>/', views.template_preview, name='template_preview'),

    path('dashboard/', views.store_list, name='store_list'),
    path('dashboard/<slug:store_slug>/', views.dashboard, name='dashboard'),

    # No store yet — the entry point for building a brand-new store (first
    # one, or an extra one on top of stores the account already has).
    path('builder/new/', views.builder_theme, name='builder_new'),

    path('builder/<slug:store_slug>/theme/', views.builder_theme, name='builder_theme'),
    path('builder/<slug:store_slug>/details/', views.builder_details, name='builder_details'),
    path('builder/<slug:store_slug>/sections/', views.builder_sections, name='builder_sections'),
    path('builder/<slug:store_slug>/sections/<int:section_id>/move/<str:direction>/', views.move_section, name='move_section'),
    path('builder/<slug:store_slug>/images/', views.builder_images, name='builder_images'),
    path('builder/<slug:store_slug>/images/<int:image_id>/delete/', views.delete_image, name='delete_image'),
    path('builder/<slug:store_slug>/socials/', views.builder_socials, name='builder_socials'),
    path('builder/<slug:store_slug>/socials/<int:link_id>/delete/', views.delete_social, name='delete_social'),

    path('preview/<str:token>/', views.preview_store, name='preview_store'),

    # Catch-all public store page — must stay last.
    path('<slug:slug>/', views.public_store, name='public_store'),
]
