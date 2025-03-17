# Create your tests here.
from django.test import TestCase, RequestFactory, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from django.conf import settings
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from django.urls import reverse
from .models import Post, Comment, validate_image_max_size
from .middleware import ReferrerBlockMiddleware
from django.contrib.auth import get_user_model
from unittest.mock import patch
from django.utils.timezone import now, timedelta


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
        # Add tags to the post
        self.post.tags.add("django", "testing")

        # Create a post with a publish date in the past
        self.post_with_comments_open = Post.objects.create(
            title="Post with Comments Open",
            slug="post-comments-open",
            author=self.user,
            body="This is a test post.",
            status=Post.Status.PUBLISHED,
            publish=now() - timedelta(days=1),  # Published yesterday
        )

        # Create a post with a publish date far in the past
        self.post_with_comments_closed = Post.objects.create(
            title="Post with Comments Closed",
            slug="post-comments-closed",
            author=self.user,
            body="This is another test post.",
            status=Post.Status.PUBLISHED,
            publish=now() - timedelta(days=100),  # Published 100 days ago
        )

    def test_post_creation(self):
        self.assertEqual(self.post.title, "Test Post")
        self.assertEqual(self.post.slug, "test-post")
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.body, "This is a test post.")
        self.assertEqual(self.post.status, Post.Status.DRAFT)

    def test_post_tags(self):
        # Check that the tags were added correctly
        tags = self.post.tags.names()
        self.assertIn("django", tags)
        self.assertIn("testing", tags)
        self.assertEqual(len(tags), 2)

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

    def test_comments_open(self):
        # Assuming comments are open for posts published within the last 7 days
        self.assertFalse(self.post_with_comments_open.comments_closed)

    def test_comments_closed(self):
        # Assuming comments are closed for posts published more than 7 days ago
        self.assertTrue(self.post_with_comments_closed.comments_closed)


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


class ReferrerBlockMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.get_response = lambda request: HttpResponse()
        self.middleware = ReferrerBlockMiddleware(self.get_response)
        settings.PASSWORD_PROTECTED_REFERRERS = ["blocked.com"]

    def test_redirects_to_password_protected_page(self):
        request = self.factory.get("/some-path", HTTP_REFERER="http://blocked.com")
        request.session = {}
        response = self.middleware(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn("/blog/password-required/", response.url)

    def test_does_not_redirect_if_authenticated(self):
        request = self.factory.get("/some-path", HTTP_REFERER="http://blocked.com")
        request.session = {"password_authenticated": True}
        response = self.middleware(request)
        self.assertEqual(response.status_code, 200)

    def test_does_not_redirect_if_referrer_not_blocked(self):
        request = self.factory.get("/some-path", HTTP_REFERER="http://allowed.com")
        request.session = {}
        response = self.middleware(request)
        self.assertEqual(response.status_code, 200)


class PasswordRequiredViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse("blog:password_required")
        self.correct_password = "correct_password"
        self.next_url = "/blog/"

    @patch("blog.views.config")
    def test_password_required_get(self, mock_config):
        response = self.client.get(self.url, {"next": self.next_url})
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/password_required.html")

    @patch("blog.views.config")
    def test_password_required_post_correct_password(self, mock_config):
        mock_config.return_value = self.correct_password
        response = self.client.post(
            self.url, {"password": self.correct_password, "next": self.next_url}
        )
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.next_url)
        self.assertTrue(self.client.session["password_authenticated"])

    @patch("blog.views.config")
    def test_password_required_post_incorrect_password(self, mock_config):
        mock_config.return_value = self.correct_password
        response = self.client.post(
            self.url, {"password": "wrong_password", "next": self.next_url}
        )
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/password_required.html")
        self.assertContains(response, "Incorrect password. Please try again.")
        self.assertFalse(self.client.session.get("password_authenticated", False))


class PostListViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )

        # Create multiple posts
        self.post1 = Post.objects.create(
            title="Post 1",
            slug="post-1",
            author=self.user,
            body="Body of post 1",
            status=Post.Status.PUBLISHED,
        )
        self.post2 = Post.objects.create(
            title="Post 2",
            slug="post-2",
            author=self.user,
            body="Body of post 2",
            status=Post.Status.PUBLISHED,
        )
        self.post3 = Post.objects.create(
            title="Post 3",
            slug="post-3",
            author=self.user,
            body="Body of post 3",
            status=Post.Status.DRAFT,  # This post should not appear in the list
        )

        # Add tags to posts
        self.post1.tags.add("django")
        self.post2.tags.add("testing")

    def test_post_list_view(self):
        response = self.client.get(reverse("blog:post_list"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "blog/post/list.html")
        self.assertContains(response, "Post 1")
        self.assertContains(response, "Post 2")
        self.assertNotContains(response, "Post 3")  # Draft post should not appear

    def test_post_list_view_with_tag(self):
        response = self.client.get(
            reverse("blog:post_list_by_tag", kwargs={"tag_slug": "django"})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Post 1")
        self.assertNotContains(response, "Post 2")
        self.assertNotContains(response, "Post 3")

    def test_post_list_pagination(self):
        # Create additional posts to test pagination
        for i in range(8):
            Post.objects.create(
                title=f"Post {i + 4}",
                slug=f"post-{i + 4}",
                author=self.user,
                body=f"Body of post {i + 4}",
                status=Post.Status.PUBLISHED,
            )

        response = self.client.get(reverse("blog:post_list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["posts"]), 7)  # Paginate by 7

        # Test second page
        response = self.client.get(reverse("blog:post_list") + "?page=2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["posts"]), 3)  # Remaining posts
