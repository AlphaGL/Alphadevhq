from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User


class SignupForm(forms.Form):
    business_name = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'placeholder': 'Your business name'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'you@business.com'}))
    phone = forms.CharField(
        max_length=20,
        widget=forms.TextInput(attrs={'placeholder': '2348012345678'}),
        help_text='WhatsApp number with country code, no spaces or plus sign.',
    )
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm password', widget=forms.PasswordInput)

    def clean_email(self):
        email = self.cleaned_data['email'].lower().strip()
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def clean_phone(self):
        phone = ''.join(ch for ch in self.cleaned_data['phone'] if ch.isdigit())
        if len(phone) < 10:
            raise forms.ValidationError('Enter a valid phone number with country code.')
        return phone

    def clean(self):
        cleaned = super().clean()
        p1, p2 = cleaned.get('password1'), cleaned.get('password2')
        if p1 and p2 and p1 != p2:
            self.add_error('password2', 'Passwords do not match.')
        if p1 and len(p1) < 8:
            self.add_error('password1', 'Use at least 8 characters.')
        return cleaned


class LoginForm(AuthenticationForm):
    username = forms.EmailField(label='Email', widget=forms.EmailInput(attrs={'placeholder': 'you@business.com'}))


class OTPForm(forms.Form):
    code = forms.CharField(
        max_length=6, min_length=6,
        widget=forms.TextInput(attrs={'placeholder': '______', 'inputmode': 'numeric', 'autocomplete': 'one-time-code', 'class': 'otp-input'}),
    )
