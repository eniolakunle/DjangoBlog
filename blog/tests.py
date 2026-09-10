# Create your tests here.
<<<<<<< HEAD
from unittest.mock import MagicMock, patch
=======
from unittest.mock import MagicMock
>>>>>>> origin/html-for-prod

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse
from django.utils.timezone import now, timedelta

from blog.utils import split_and_randomize_similar_posts

from .models import Comment, Post, validate_image_max_size


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

    def test_read_time(self):
        self.assertEqual(self.post.read_time, "1 min")


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
        self.comment_no_email = Comment.objects.create(
            post=self.post,
            name="Test Commenter",
            body="This is a test comment.",
        )

    def test_comment_creation(self):
        self.assertEqual(self.comment.post, self.post)
        self.assertEqual(self.comment.name, "Test Commenter")
        self.assertEqual(self.comment.email, "test@example.com")
        self.assertEqual(self.comment.body, "This is a test comment.")

    def test_comment_creation_no_email(self):
        self.assertEqual(self.comment_no_email.post, self.post)
        self.assertEqual(self.comment_no_email.name, "Test Commenter")
        self.assertEqual(self.comment_no_email.email, None)
        self.assertEqual(self.comment_no_email.body, "This is a test comment.")

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


class SplitAndRandomizeSimilarPostsTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )

        # Create mock posts
        self.posts = [
            Post(
                title=f"Post {i}",
                slug=f"post-{i}",
                author=self.user,
                body=f"Body of post {i}",
                status=Post.Status.PUBLISHED,
            )
            for i in range(10)
        ]

        # Mock the PublishedManager
        self.mock_manager = MagicMock()
        self.mock_manager.count.return_value = len(self.posts)
        self.mock_manager.__getitem__.side_effect = lambda x: self.posts[x]

    def test_split_and_randomize_similar_posts(self):
        # Call the function with the mock manager
        result = split_and_randomize_similar_posts(self.mock_manager)

        # Ensure the result is a list
        self.assertIsInstance(result, list)

        # Ensure the result contains 4 posts (amount_of_posts_to_show = 4)
        self.assertEqual(len(result), 4)

        # Ensure the result contains posts from the original list
        for post in result:
            self.assertIn(post, self.posts)

    def test_split_and_randomize_with_fewer_posts(self):
        # Adjust the mock manager to have fewer posts
        self.mock_manager.count.return_value = 2
        self.mock_manager.__getitem__.side_effect = lambda x: self.posts[:2][x]

        # Call the function with the mock manager
        result = split_and_randomize_similar_posts(self.mock_manager)

        # Ensure the result is a list
        self.assertIsInstance(result, list)

        # Ensure the result contains 2 posts (since there are only 2 posts)
        self.assertEqual(len(result), 2)

        # Ensure the result contains posts from the original list
        for post in result:
            self.assertIn(post, self.posts[:2])


class PostDetailViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        settings.USE_TZ = False
        self.user = get_user_model().objects.create_user(
            username="testuser", password="12345"
        )
        image_data = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
            b"\x00\x00\x00\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00"
            b"\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01"
            b"\x00\x3b"
        )
        image_file = SimpleUploadedFile(
            "test.gif", image_data, content_type="image/gif"
        )
        # Create a published post
        self.post = Post.objects.create(
            title="Test Post",
            slug="test-post",
            author=self.user,
            body="This is a test post.",
            status=Post.Status.PUBLISHED,
            featured_image=image_file,
        )
        self.post.tags.add("django", "testing")

        # Create similar posts with the same tags
        self.similar_post_1 = Post.objects.create(
            title="Similar Post 1",
            slug="similar-post-1",
            author=self.user,
            body="This is a similar post.",
            status=Post.Status.PUBLISHED,
            featured_image=image_file,
        )
        self.similar_post_1.tags.add("django")

        self.similar_post_2 = Post.objects.create(
            title="Similar Post 2",
            slug="similar-post-2",
            author=self.user,
            body="This is another similar post.",
            status=Post.Status.PUBLISHED,
            featured_image=image_file,
        )
        self.similar_post_2.tags.add("testing")

        # Create a post with no similar tags
        self.unrelated_post = Post.objects.create(
            title="Unrelated Post",
            slug="unrelated-post",
            author=self.user,
            body="This is an unrelated post.",
            status=Post.Status.PUBLISHED,
            featured_image=image_file,
        )
        self.unrelated_post.tags.add("unrelated")

        # Create a draft post (should not be accessible)
        self.draft_post = Post.objects.create(
            title="Draft Post",
            slug="draft-post",
            author=self.user,
            body="This is a draft post.",
            status=Post.Status.DRAFT,
        )

    def test_post_detail_view_published_post(self):
        url = reverse(
            "blog:post_detail",
            kwargs={
                "year": self.post.publish.year,
                "month": self.post.publish.month,
                "day": self.post.publish.day,
                "post": self.post.slug,
            },
        )
        response = self.client.get(url)

        # Check that the response is 200 OK
        self.assertEqual(response.status_code, 200)

        # Check that the correct template is used
        self.assertTemplateUsed(response, "blog/post/detail.html")

        # Check that the post is in the context
        self.assertEqual(response.context["post"], self.post)

    def test_post_detail_view_draft_post(self):
        url = reverse(
            "blog:post_detail",
            kwargs={
                "year": self.draft_post.publish.year,
                "month": self.draft_post.publish.month,
                "day": self.draft_post.publish.day,
                "post": self.draft_post.slug,
            },
        )
        response = self.client.get(url)

        # Check that the response is 404 Not Found
        self.assertEqual(response.status_code, 404)

    def test_post_detail_view_nonexistent_post(self):
        url = reverse(
            "blog:post_detail",
            kwargs={
                "year": 2023,
                "month": 1,
                "day": 1,
                "post": "nonexistent-post",
            },
        )
        response = self.client.get(url)

        # Check that the response is 404 Not Found
        self.assertEqual(response.status_code, 404)

    def test_post_detail_view_similar_posts(self):
        url = reverse(
            "blog:post_detail",
            kwargs={
                "year": self.post.publish.year,
                "month": self.post.publish.month,
                "day": self.post.publish.day,
                "post": self.post.slug,
            },
        )
        response = self.client.get(url)

        # Check that similar_posts is in the context
        self.assertIn("similar_posts", response.context)

        # Check that similar_posts contains the expected posts
        similar_posts = response.context["similar_posts"]
        self.assertIn(self.similar_post_1, similar_posts)
        self.assertIn(self.similar_post_2, similar_posts)
        self.assertNotIn(self.unrelated_post, similar_posts)
        # Check that the number of similar posts is correct
        self.assertEqual(len(similar_posts), 2)
