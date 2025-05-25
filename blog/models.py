import readtime
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.urls import reverse
from django_ckeditor_5.fields import CKEditor5Field
from taggit.managers import TaggableManager
from datetime import datetime, timedelta

# from django.db.models.functions import Now


def validate_image_max_size(image):
    max_size_kb = 500
    if image.size > max_size_kb * 1024:  # convert KB to bytes
        raise ValidationError(
            f"Image file too large (maximum {max_size_kb}KB allowed)."
        )


# Create your models here.


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status=Post.Status.PUBLISHED)


class Post(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DF", "Draft"
        PUBLISHED = "PB", "PUBLISHED"

    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=250, unique_for_date="publish")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blog_posts"
    )
    featured_image = models.ImageField(
        upload_to="featured_images/",
        blank=True,
        null=True,
        validators=[validate_image_max_size],
    )
    body = CKEditor5Field("Text", config_name="extends")
    publish = models.DateTimeField(default=timezone.now)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=2, choices=Status, default=Status.DRAFT)
    tags = TaggableManager()

    objects = models.Manager()
    published = PublishedManager()

    class Meta:
        ordering = ["-publish"]
        indexes = [
            models.Index(fields=["-publish"]),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse(
            "blog:post_detail",
            args=[
                self.publish.year,
                self.publish.month,
                self.publish.day,
                self.slug,
            ],
        )

    @property
    def comments_closed(self):
        return (self.publish + timedelta(days=7)) < datetime.now(self.publish.tzinfo)

    @property
    def read_time(self):
        readTime = readtime.of_html(self.body)
        return readTime.text


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    name = models.CharField(max_length=25)
    email = models.EmailField(blank=True, null=True)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"Comment by {self.name} on {self.post}"

    class Meta:
        ordering = ["-created"]
        indexes = [models.Index(fields=["created"])]
