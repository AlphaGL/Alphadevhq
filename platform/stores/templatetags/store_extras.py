import re

from django import template

register = template.Library()

TAG_RE = re.compile(r'\s*\[([^\[\]]+)\]\s*$')


def _split_line(line):
    line = line.strip()
    if not line:
        return None
    tag = ''
    m = TAG_RE.search(line)
    if m:
        tag = m.group(1).strip()
        line = TAG_RE.sub('', line).strip()
    if ' — ' in line:
        title, subtitle = line.split(' — ', 1)
    elif ' - ' in line:
        title, subtitle = line.split(' - ', 1)
    else:
        title, subtitle = line, ''
    return {'title': title.strip(), 'subtitle': subtitle.strip(), 'tag': tag}


@register.filter
def parse_services(text):
    """Turns freeform service lines into structured cards.
    Line format: 'Title — subtitle text [Tag]' (subtitle and tag both optional)."""
    if not text:
        return []
    return [item for item in (_split_line(line) for line in text.splitlines()) if item]


@register.filter
def service_tags(text):
    """Distinct tags found in the service lines, in first-seen order."""
    tags = []
    for item in parse_services(text):
        if item['tag'] and item['tag'] not in tags:
            tags.append(item['tag'])
    return tags


@register.filter
def cdn(url, width=800):
    """Ask Cloudinary for a resized, compressed copy of an uploaded image:
    `{{ img.url|cdn:640 }}`. Picks WebP/AVIF automatically per browser and
    never upscales. A 500 KB template screenshot comes back ~15 KB, which
    is the difference between instant and painfully slow on a cheap
    Android phone. Non-Cloudinary URLs (local dev) pass through unchanged."""
    url = str(url or '')
    marker = '/image/upload/'
    if 'res.cloudinary.com' not in url or marker not in url:
        return url
    head, tail = url.split(marker, 1)
    if tail.startswith(('f_', 'q_', 'w_', 'c_')):
        return url  # already transformed
    return f"{head}{marker}f_auto,q_auto,c_limit,w_{int(width)}/{tail}"
