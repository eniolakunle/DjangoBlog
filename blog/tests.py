# Create your tests here.
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from django.core.exceptions import ValidationError
from django.urls import reverse
from .models import Post, Comment, validate_image_max_size
from django.contrib.auth import get_user_model


class PostModelTest(TestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )
        self.post = Post.objects.create(
            title="Test Post",
            slug="test-post",
            author=self.user,
            body="This is a test post.",
            status=Post.Status.DRAFT,
        )

    def test_post_creation(self):
        self.assertEqual(self.post.title, "Test Post")
        self.assertEqual(self.post.slug, "test-post")
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.body, "This is a test post.")
        self.assertEqual(self.post.status, Post.Status.DRAFT)

    def test_post_str(self):
        self.assertEqual(str(self.post), "Test Post")

    def test_get_absolute_url(self):
        self.assertEqual(
            self.post.get_absolute_url(),
            f"/blog/{self.post.publish.year}/{self.post.publish.month}/{self.post.publish.day}/{self.post.slug}/",
        )

    def test_published_manager(self):
        published_post = Post.objects.create(
            title="Published Post",
            slug="published-post",
            author=self.user,
            body="This is a published post.",
            status=Post.Status.PUBLISHED,
        )
        self.assertIn(published_post, Post.published.all())
        self.assertNotIn(self.post, Post.published.all())


class CommentModelTest(TestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )
        self.post = Post.objects.create(
            title="Test Post",
            slug="test-post",
            author=self.user,
            body="This is a test post.",
            status=Post.Status.DRAFT,
        )
        self.comment = Comment.objects.create(
            post=self.post,
            name="Test Commenter",
            email="test@example.com",
            body="This is a test comment.",
        )

    def test_comment_creation(self):
        self.assertEqual(self.comment.post, self.post)
        self.assertEqual(self.comment.name, "Test Commenter")
        self.assertEqual(self.comment.email, "test@example.com")
        self.assertEqual(self.comment.body, "This is a test comment.")

    def test_comment_str(self):
        self.assertEqual(
            str(self.comment), f"Comment by {self.comment.name} on {self.comment.post}"
        )


class ValidateImageMaxSizeTest(TestCase):

    def test_validate_image_max_size_valid(self):
        image = SimpleUploadedFile(
            name="test_image.jpg",
            content=b"\x00" * 500 * 1024,  # 500 KB
            content_type="image/jpeg",
        )
        try:
            validate_image_max_size(image)
        except ValidationError:
            self.fail("validate_image_max_size() raised ValidationError unexpectedly!")

    def test_validate_image_max_size_invalid(self):
        image = SimpleUploadedFile(
            name="test_image.jpg",
            content=b"\x00" * 501 * 1024,  # 501 KB
            content_type="image/jpeg",
        )
        with self.assertRaises(ValidationError):
            validate_image_max_size(image)


class PostShareViewTest(TestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )
        self.post = Post.objects.create(
            title="Test Post",
            slug="test-post",
            author=self.user,
            body="This is a test post.",
            status=Post.Status.PUBLISHED,
        )
        self.url = reverse("blog:post_share", args=[self.post.id])

    def test_post_share_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/post/share.html")
        self.assertContains(response, self.post.title)

    def test_post_share_post_valid(self):
        data = {
            "name": "Test User",
            "email": "test@example.com",
            "to": "friend@example.com",
            "comments": "Check out this post!",
            "captcha_0": "dummy-key",  # This value is not validated in test mode.
            "captcha_1": "PASSED",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/post/share.html")
        self.assertTrue(response.context["sent"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            "Test User (test@example.com) recommends you read Test Post",
            mail.outbox[0].subject,
        )

    def test_post_share_post_invalid(self):
        data = {
            "name": "",  # Invalid data: name is required
            "email": "invalid-email",  # Invalid data: email format is incorrect
            "to": "friend@example.com",
            "comments": "Check out this post!",
            "captcha_0": "dummy-key",
            "captcha_1": "PASSED",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/post/share.html")
        self.assertFalse(response.context["form"].is_valid())
        self.assertContains(response, "This field is required.", html=True)
        self.assertContains(response, "Enter a valid email address.", html=True)
