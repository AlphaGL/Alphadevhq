from django.urls import path

from . import views

app_name = 'accounts'

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('google/login/', views.google_login, name='google_login'),
    path('google/callback/', views.google_callback, name='google_callback'),
    path('google/phone/', views.google_phone, name='google_phone'),
    path('verify/', views.verify_otp, name='verify'),
    path('verify/resend/', views.resend_otp, name='resend_otp'),
]
