# myapp/middleware.py
from django.shortcuts import redirect
from django.conf import settings
from urllib.parse import quote


class ReferrerBlockMiddleware:
    """
    This middleware checks the HTTP referrer header.
    If the referrer matches one of the blocked domains (set in settings),
    the user is redirected to a password-protected page.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Read the list of blocked referrers from Django settings.
        self.blocked_referrers = settings.BLOCKED_REFERRERS

    def __call__(self, request):
        referrer = request.META.get("HTTP_REFERER", "")
        # If any blocked domain is found in the referrer URL, redirect.
        if request.path == "/blog/password-required/":
            return self.get_response(request)

        if any(
            blocked_domain.lower() in referrer.lower()
            for blocked_domain in self.blocked_referrers
        ):
            # Optionally, you can check if the user is already authenticated for the password.
            print(request.COOKIES)
            if not request.COOKIES.get("password_authenticated", False):
                return redirect(
                    f"/blog/password-required/?next={quote(request.get_full_path())}",
                )
        return self.get_response(request)
