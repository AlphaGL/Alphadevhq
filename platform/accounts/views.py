import secrets

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import redirect, render
from django.urls import reverse

from . import google_auth
from .forms import GooglePhoneForm, LoginForm, OTPForm, SignupForm
from .otp import send_otp


def signup(request):
    if request.user.is_authenticated:
        return redirect('stores:store_list')

    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            user = User.objects.create_user(
                username=data['email'],
                email=data['email'],
                password=data['password1'],
            )
            user.profile.phone = data['phone']
            user.profile.save(update_fields=['phone'])

            login(request, user)
            request.session['pending_business_name'] = data['business_name']

            code = user.profile.generate_otp()
            send_otp(data['phone'], code)

            messages.info(request, 'We sent a verification code to your WhatsApp number.')
            return redirect('accounts:verify')
    else:
        form = SignupForm()

    return render(request, 'accounts/signup.html', {'form': form, 'google_configured': google_auth.is_configured()})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('stores:store_list')

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('stores:store_list')
    else:
        form = LoginForm(request)

    return render(request, 'accounts/login.html', {'form': form, 'google_configured': google_auth.is_configured()})


def logout_view(request):
    logout(request)
    return redirect('stores:home')


def google_login(request):
    if request.user.is_authenticated:
        return redirect('stores:store_list')
    if not google_auth.is_configured():
        messages.error(request, 'Google sign-in is not set up yet.')
        return redirect('accounts:login')

    state = secrets.token_urlsafe(24)
    request.session['google_oauth_state'] = state
    redirect_uri = request.build_absolute_uri(reverse('accounts:google_callback'))
    return redirect(google_auth.build_auth_url(redirect_uri, state))


def google_callback(request):
    expected_state = request.session.pop('google_oauth_state', None)
    state = request.GET.get('state')
    code = request.GET.get('code')

    if not code or not state or state != expected_state:
        messages.error(request, "That Google sign-in link expired or was cancelled. Please try again.")
        return redirect('accounts:login')

    redirect_uri = request.build_absolute_uri(reverse('accounts:google_callback'))
    try:
        identity = google_auth.get_user_identity(code, redirect_uri)
    except google_auth.GoogleAuthError:
        messages.error(request, "Couldn't complete Google sign-in. Please try again.")
        return redirect('accounts:login')

    user, created = User.objects.get_or_create(
        username=identity['email'],
        defaults={'email': identity['email'], 'first_name': identity['first_name']},
    )
    if created:
        user.set_unusable_password()
        user.save()

    user.profile.google_sub = identity['sub']
    user.profile.save(update_fields=['google_sub'])

    login(request, user)

    if not user.profile.phone:
        return redirect('accounts:google_phone')
    return redirect('stores:store_list')


@login_required
def google_phone(request):
    """One-time step for a fresh Google sign-up: Google verifies the email,
    but this product is WhatsApp-first, so we still need — and still verify
    — a phone number, same as the regular signup path."""
    profile = request.user.profile
    if profile.phone:
        return redirect('stores:store_list')

    if request.method == 'POST':
        form = GooglePhoneForm(request.POST)
        if form.is_valid():
            profile.phone = form.cleaned_data['phone']
            profile.save(update_fields=['phone'])
            code = profile.generate_otp()
            send_otp(profile.phone, code)
            messages.info(request, 'We sent a verification code to your WhatsApp number.')
            return redirect('accounts:verify')
    else:
        form = GooglePhoneForm()

    return render(request, 'accounts/google_phone.html', {'form': form})


@login_required
def verify_otp(request):
    profile = request.user.profile
    if profile.is_verified:
        return redirect('stores:store_list')

    if request.method == 'POST':
        form = OTPForm(request.POST)
        if form.is_valid():
            if profile.otp_is_valid(form.cleaned_data['code']):
                profile.mark_verified()
                messages.success(request, "You're verified. Let's set up your store.")
                return redirect('stores:builder_new')
            profile.otp_attempts += 1
            profile.save(update_fields=['otp_attempts'])
            form.add_error('code', 'That code is wrong or has expired.')
    else:
        form = OTPForm()

    # Dev-mode visibility: show the code on screen when no SMS provider is wired up.
    from django.conf import settings
    dev_code = profile.otp_code if not settings.SMS_PROVIDER_API_KEY else None

    return render(request, 'accounts/verify.html', {'form': form, 'dev_code': dev_code})


@login_required
def resend_otp(request):
    profile = request.user.profile
    code = profile.generate_otp()
    send_otp(profile.phone, code)
    messages.info(request, 'A new code has been sent.')
    return redirect('accounts:verify')
