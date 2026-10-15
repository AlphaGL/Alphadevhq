"""
Paystack integration for Alpha Dev Stores subscriptions.

Every function here degrades gracefully when PAYSTACK_SECRET_KEY is not
set in the environment — they return a {'status': False, 'message': ...}
dict instead of raising, so the rest of the app keeps working while
billing is not yet wired up to a real Paystack account.
"""
import requests
from django.conf import settings

BASE_URL = 'https://api.paystack.co'
TIMEOUT = 15


def is_configured():
    return bool(settings.PAYSTACK_SECRET_KEY)


def _headers():
    return {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def initialize_transaction(email, amount_naira, reference, callback_url):
    """Start a payment. Returns Paystack's response, which on success
    includes an 'authorization_url' to redirect the user to."""
    if not is_configured():
        return {'status': False, 'message': 'Paystack is not configured yet.'}
    payload = {
        'email': email,
        'amount': int(amount_naira * 100),  # Paystack expects kobo
        'reference': reference,
        'callback_url': callback_url,
    }
    try:
        resp = requests.post(f'{BASE_URL}/transaction/initialize', json=payload, headers=_headers(), timeout=TIMEOUT)
        return resp.json()
    except requests.RequestException as e:
        return {'status': False, 'message': str(e)}


def verify_transaction(reference):
    if not is_configured():
        return {'status': False, 'message': 'Paystack is not configured yet.'}
    try:
        resp = requests.get(f'{BASE_URL}/transaction/verify/{reference}', headers=_headers(), timeout=TIMEOUT)
        return resp.json()
    except requests.RequestException as e:
        return {'status': False, 'message': str(e)}
