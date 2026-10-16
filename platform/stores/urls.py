from django.urls import path

from . import views

app_name = 'stores'

urlpatterns = [
    path('', views.agency_home, name='home'),
    path('get-a-store/', views.store_landing, name='store_landing'),
    path('explore/', views.explore, name='explore'),
    path('check-name/', views.slug_check, name='slug_check'),
    path('template-preview/<slug:slug>/', views.template_preview, name='template_preview'),
    path('legal/privacy/', views.privacy_policy, name='privacy'),
    path('legal/terms/', views.terms, name='terms'),

    path('dashboard/', views.store_list, name='store_list'),
    path('dashboard/<slug:store_slug>/', views.dashboard, name='dashboard'),

    # No store yet — the entry point for building a brand-new store (first
    # one, or an extra one on top of stores the account already has).
    path('builder/new/', views.builder_theme, name='builder_new'),

    path('builder/<slug:store_slug>/theme/', views.builder_theme, name='builder_theme'),
    path('builder/<slug:store_slug>/edit/', views.builder_edit, name='builder_edit'),

    # Click-to-edit AJAX endpoints — all JSON, all require store ownership.
    path('builder/<slug:store_slug>/edit/field/', views.editor_save_field, name='editor_save_field'),
    path('builder/<slug:store_slug>/edit/section/<int:section_id>/toggle/', views.editor_toggle_section, name='editor_toggle_section'),
    path('builder/<slug:store_slug>/edit/section/<int:section_id>/move/<str:direction>/', views.editor_move_section, name='editor_move_section'),
    path('builder/<slug:store_slug>/edit/logo/', views.editor_upload_logo, name='editor_upload_logo'),
    path('builder/<slug:store_slug>/edit/image/add/', views.editor_add_image, name='editor_add_image'),
    path('builder/<slug:store_slug>/edit/image/<int:image_id>/delete/', views.editor_delete_image, name='editor_delete_image'),
    path('builder/<slug:store_slug>/edit/social/', views.editor_save_social, name='editor_save_social'),

    path('preview/<str:token>/', views.preview_store, name='preview_store'),

    # Extra pages for multi-page (Growth tier) templates only.
    path('<slug:slug>/<str:page>/', views.public_store_page, name='public_store_page'),

    # Catch-all public store page — must stay last.
    path('<slug:slug>/', views.public_store, name='public_store'),
]
