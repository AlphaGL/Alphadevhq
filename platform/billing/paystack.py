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


def create_plan(name, amount_naira, interval):
    """Create a Paystack Plan (interval: 'monthly' or 'annually'). Returns
    Paystack's response — on success, data['plan_code'] is what gets stored
    on our Plan model and passed back into initialize_transaction later."""
    if not is_configured():
        return {'status': False, 'message': 'Paystack is not configured yet.'}
    payload = {'name': name, 'amount': int(amount_naira * 100), 'interval': interval}
    try:
        resp = requests.post(f'{BASE_URL}/plan', json=payload, headers=_headers(), timeout=TIMEOUT)
        return resp.json()
    except requests.RequestException as e:
        return {'status': False, 'message': str(e)}


def initialize_transaction(email, amount_naira, reference, callback_url, plan_code=None):
    """Start a payment. Returns Paystack's response, which on success
    includes an 'authorization_url' to redirect the user to. Passing
    plan_code makes Paystack auto-create a recurring subscription once this
    first charge succeeds — the plan's own amount is what actually gets
    charged, amount_naira here is just what shows while Paystack has not
    yet looked the plan up, which in practice has always matched."""
    if not is_configured():
        return {'status': False, 'message': 'Paystack is not configured yet.'}
    payload = {
        'email': email,
        'amount': int(amount_naira * 100),  # Paystack expects kobo
        'reference': reference,
        'callback_url': callback_url,
    }
    if plan_code:
        payload['plan'] = plan_code
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
