#!/bin/bash
set -e

# Install dependencies
pip install setuptools
pip install -r requirements.txt

# Apply committed migrations (never generate new ones at build time) and
# collect static files for whitenoise/Vercel to serve.
python manage.py migrate --noinput
python manage.py collectstatic --noinput
