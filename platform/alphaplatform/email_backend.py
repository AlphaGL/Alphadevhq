"""Routes Django's normal send_mail()/EmailMessage through Brevo's
transactional email API instead of SMTP — stdlib only, no extra dependency,
same pattern as accounts/google_auth.py. Any code that calls Django's usual
mail functions picks this up automatically once EMAIL_BACKEND points here."""
import json
import urllib.error
import urllib.request
from email.utils import parseaddr

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

API_URL = 'https://api.brevo.com/v3/smtp/email'


class BrevoAPIBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        if not settings.BREVO_API_KEY:
            if not self.fail_silently:
                raise RuntimeError('BREVO_API_KEY is not set.')
            return 0

        sent = 0
        for message in email_messages:
            if self._send_one(message):
                sent += 1
        return sent

    def _send_one(self, message):
        html_body = None
        for alt_body, alt_type in getattr(message, 'alternatives', []):
            if alt_type == 'text/html':
                html_body = alt_body
                break

        from_name, from_email = parseaddr(message.from_email or settings.DEFAULT_FROM_EMAIL)
        sender = {'email': from_email}
        if from_name:
            sender['name'] = from_name

        payload = {
            'sender': sender,
            'to': [{'email': addr} for addr in message.to],
            'subject': message.subject,
            'textContent': message.body,
        }
        if html_body:
            payload['htmlContent'] = html_body
        if message.cc:
            payload['cc'] = [{'email': addr} for addr in message.cc]
        if message.bcc:
            payload['bcc'] = [{'email': addr} for addr in message.bcc]

        body = json.dumps(payload).encode()
        req = urllib.request.Request(API_URL, data=body, method='POST', headers={
            'api-key': settings.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp.read()
            return True
        except urllib.error.HTTPError as exc:
            if not self.fail_silently:
                raise RuntimeError(f'Brevo send failed ({exc.code}): {exc.read().decode(errors="replace")}')
            return False
        except urllib.error.URLError as exc:
            if not self.fail_silently:
                raise RuntimeError(f'Brevo send failed: {exc}')
            return False
