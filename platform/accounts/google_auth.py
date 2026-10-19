"""Minimal Google OAuth2 "Authorization Code" flow — no extra dependency,
just the stdlib. We exchange the code for an access token server-to-server
(code never touches the browser as anything but an opaque, one-time value),
then ask Google's own userinfo endpoint who it belongs to. That round trip
to Google is what makes the identity trustworthy — nothing here is ever
taken from the client's request unverified."""
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN_URL = 'https://oauth2.googleapis.com/token'
USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'


class GoogleAuthError(Exception):
    pass


def is_configured():
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def build_auth_url(redirect_uri, state):
    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'prompt': 'select_account',
    }
    return AUTH_URL + '?' + urllib.parse.urlencode(params)


def _post(url, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError as exc:
        raise GoogleAuthError(str(exc))


def _get(url, access_token):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {access_token}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError as exc:
        raise GoogleAuthError(str(exc))


def get_user_identity(code, redirect_uri):
    """Exchange an authorization code for the signed-in user's verified
    email + Google account id. Raises GoogleAuthError on any failure."""
    tokens = _post(TOKEN_URL, {
        'code': code,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    })
    access_token = tokens.get('access_token')
    if not access_token:
        raise GoogleAuthError('No access token returned by Google.')

    userinfo = _get(USERINFO_URL, access_token)
    if not userinfo.get('email') or not userinfo.get('email_verified'):
        raise GoogleAuthError('Google account has no verified email.')

    return {
        'email': userinfo['email'].lower().strip(),
        'sub': userinfo.get('sub', ''),
        'first_name': (userinfo.get('given_name') or '')[:30],
    }
