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
