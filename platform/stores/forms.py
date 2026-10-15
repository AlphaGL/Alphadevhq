from django import forms

from .models import StoreTemplate


class TemplatePickForm(forms.Form):
    template = forms.ModelChoiceField(
        queryset=StoreTemplate.objects.filter(is_active=True), widget=forms.RadioSelect, empty_label=None,
    )
