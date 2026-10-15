from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import redirect, render

from .forms import LoginForm, OTPForm, SignupForm
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

    return render(request, 'accounts/signup.html', {'form': form})


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

    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('stores:home')


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
