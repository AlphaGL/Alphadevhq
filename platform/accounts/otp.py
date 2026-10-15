"""
OTP delivery for Alpha Dev Stores signup.

Without a real SMS provider key, this just logs the code and returns it
in 'dev_code' so the verification flow is fully testable end to end in
development. Wire up a provider such as Termii here once you have an
account and API key.
"""
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def send_otp(phone, code):
    if not settings.SMS_PROVIDER_API_KEY:
        logger.info("[DEV OTP] Would send to %s: your Alpha Dev code is %s", phone, code)
        return {'sent': False, 'dev_code': code}

    # Example Termii integration — uncomment and adapt once SMS_PROVIDER_API_KEY is set:
    #
    # import requests
    # resp = requests.post('https://api.ng.termii.com/api/sms/send', json={
    #     'api_key': settings.SMS_PROVIDER_API_KEY,
    #     'to': phone,
    #     'from': 'AlphaDev',
    #     'sms': f'Your Alpha Dev verification code is {code}',
    #     'type': 'plain',
    #     'channel': 'generic',
    # }, timeout=15)
    # return {'sent': resp.ok}

    return {'sent': False, 'dev_code': code}
