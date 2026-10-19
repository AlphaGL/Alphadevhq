"""
Django settings for alphaplatform project (Alpha Dev Stores).
"""

from pathlib import Path
from decouple import config
import cloudinary
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',

    # Third party
    'cloudinary_storage',
    'cloudinary',

    # Local apps
    'accounts',
    'stores',
    'billing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'stores.middleware.StoreDomainMiddleware',
    'stores.middleware.StoreVisitMiddleware',
]

ROOT_URLCONF = 'alphaplatform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'alphaplatform.wsgi.application'

# ---------------------------------------------------------------------------
# Database. Falls back to local SQLite (your own storage, no setup needed)
# unless a real DATABASE_URL is supplied in .env for production, e.g. a
# Postgres instance from Neon, Railway or Supabase.
#
# Read via decouple (not dj_database_url.config, which only looks at real
# os.environ) so a DATABASE_URL set in a local .env file is actually picked
# up — matters for local testing; on Vercel, env vars are real os.environ
# either way.
# ---------------------------------------------------------------------------
DATABASE_URL = config('DATABASE_URL', default='')
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = 'accounts:login'
LOGIN_REDIRECT_URL = 'stores:store_list'
LOGOUT_REDIRECT_URL = 'stores:home'

# ---------------------------------------------------------------------------
# Deployment behind Vercel's proxy: it terminates HTTPS and forwards plain
# HTTP to the function, so Django needs to trust the forwarded-proto header
# to correctly detect secure requests (cookies, redirects, CSRF).
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = [
    origin for origin in config('CSRF_TRUSTED_ORIGINS', default='').split(',') if origin
]

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# ---------------------------------------------------------------------------
# Image storage. Falls back to local disk (your own storage, under MEDIA_ROOT)
# unless real Cloudinary credentials are supplied in .env. Model fields use
# plain Django ImageField (see stores/models.py) so the same field works with
# either backend — only this setting decides where files actually land.
# ---------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
CLOUDINARY_API_KEY = config('CLOUDINARY_API_KEY', default='')
CLOUDINARY_API_SECRET = config('CLOUDINARY_API_SECRET', default='')

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    # Hash-based cache busting without the .gz/.br precompressed siblings —
    # keeps the committed staticfiles/ (and the Vercel lambda bundle) small.
    # WhiteNoiseMiddleware still compresses responses on the fly at serve time.
    'staticfiles': {'BACKEND': 'whitenoise.storage.ManifestStaticFilesStorage'},
}

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )
    # django-cloudinary-storage reads credentials from this dict (or raw
    # os.environ) rather than from cloudinary.config() above — needed so
    # it also works with a local .env file, not just real env vars.
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
    STORAGES['default'] = {'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'}

# ---------------------------------------------------------------------------
# Paystack (subscription billing). Needs a real secret key to actually
# charge anyone — see billing/paystack.py. Safe to leave blank in dev.
# ---------------------------------------------------------------------------
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY', default='')
PAYSTACK_PUBLIC_KEY = config('PAYSTACK_PUBLIC_KEY', default='')

# ---------------------------------------------------------------------------
# SMS / OTP delivery. Needs a real provider (e.g. Termii) to actually send
# text messages — see accounts/otp.py. In dev, OTPs are shown on screen
# and logged instead of sent.
# ---------------------------------------------------------------------------
SMS_PROVIDER_API_KEY = config('SMS_PROVIDER_API_KEY', default='')

# ---------------------------------------------------------------------------
# Transactional email, sent via Brevo's API — see alphaplatform/email_backend.py.
# Blank key falls back to printing emails to the console instead of sending.
# ---------------------------------------------------------------------------
BREVO_API_KEY = config('BREVO_API_KEY', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Alpha Dev <ichukwugozirim@gmail.com>')
EMAIL_BACKEND = (
    'alphaplatform.email_backend.BrevoAPIBackend' if BREVO_API_KEY
    else 'django.core.mail.backends.console.EmailBackend'
)

# ---------------------------------------------------------------------------
# "Continue with Google" sign-in — see accounts/google_auth.py. Needs an
# OAuth client created at https://console.cloud.google.com/apis/credentials
# (type: Web application) with an authorized redirect URI of
# <site>/accounts/google/callback/. Blank in dev just hides the button.
# ---------------------------------------------------------------------------
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')

# Store platform settings
PLATFORM_DOMAIN = config('PLATFORM_DOMAIN', default='alphadevhq.com')
DAILY_VISIT_SOFT_CAP = 5000

# Logs real errors to the console (visible in Vercel's function logs) even
# with DEBUG=False, instead of only a bare 500 page.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'ERROR', 'propagate': True},
    },
}
