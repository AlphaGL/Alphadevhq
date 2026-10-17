from django.urls import path

from . import views

app_name = 'billing'

urlpatterns = [
    path('upgrade/<slug:store_slug>/', views.choose_plan, name='choose_plan'),
    path('trial/<slug:store_slug>/<slug:plan_slug>/', views.start_trial, name='start_trial'),
    path('checkout/<slug:store_slug>/<slug:plan_slug>/', views.checkout, name='checkout'),
    path('demo-confirm/<slug:store_slug>/', views.demo_confirm, name='demo_confirm'),
    path('callback/', views.payment_callback, name='payment_callback'),
    path('webhook/', views.paystack_webhook, name='webhook'),
]
