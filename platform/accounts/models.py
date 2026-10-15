import random

from django.conf import settings
from django.db import models
from django.utils import timezone


class Profile(models.Model):
    OTP_VALID_MINUTES = 10

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} profile"

    def generate_otp(self):
        code = f"{random.randint(0, 999999):06d}"
        self.otp_code = code
        self.otp_created_at = timezone.now()
        self.otp_attempts = 0
        self.save(update_fields=['otp_code', 'otp_created_at', 'otp_attempts'])
        return code

    def otp_is_valid(self, code):
        if not self.otp_code or not self.otp_created_at:
            return False
        if timezone.now() > self.otp_created_at + timezone.timedelta(minutes=self.OTP_VALID_MINUTES):
            return False
        return code == self.otp_code

    def mark_verified(self):
        self.is_verified = True
        self.otp_code = ''
        self.otp_created_at = None
        self.save(update_fields=['is_verified', 'otp_code', 'otp_created_at'])
