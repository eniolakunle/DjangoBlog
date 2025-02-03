from django import forms
from .models import Comment, Subscriber
from captcha.fields import CaptchaField

class EmailPostForm(forms.Form):
    name = forms.CharField(max_length=25)
    email = forms.EmailField()
    to = forms.EmailField()
    comments = forms.CharField(
        required=False,
        widget=forms.Textarea
    )
    captcha = CaptchaField()

class CommentForm(forms.ModelForm):
    captcha = CaptchaField()
    class Meta:
        model = Comment
        fields = ['name', 'email', 'body']

class SubscribeForm(forms.ModelForm):
    class Meta:
        model = Subscriber
        fields = ['email']