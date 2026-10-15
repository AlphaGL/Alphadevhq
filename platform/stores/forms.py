from django import forms

from .models import SocialLink, Store, StoreImage, StoreTemplate


class TemplatePickForm(forms.Form):
    template = forms.ModelChoiceField(
        queryset=StoreTemplate.objects.filter(is_active=True), widget=forms.RadioSelect, empty_label=None,
    )


class StoreDetailsForm(forms.ModelForm):
    class Meta:
        model = Store
        fields = ['business_name', 'category', 'tagline', 'bio', 'logo', 'phone', 'address', 'hours']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
            'phone': forms.TextInput(attrs={'placeholder': '2348012345678'}),
        }


class ThemeCustomizeForm(forms.ModelForm):
    class Meta:
        model = Store
        fields = ['theme_color']
        widgets = {
            'theme_color': forms.TextInput(attrs={'type': 'color'}),
        }


class StoreImageForm(forms.ModelForm):
    class Meta:
        model = StoreImage
        fields = ['image', 'caption']


class SocialLinkForm(forms.ModelForm):
    class Meta:
        model = SocialLink
        fields = ['platform', 'url']
