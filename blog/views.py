from django.shortcuts import redirect, render, get_object_or_404
from .models import Post
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.http import require_POST
from django.views.generic import ListView
from .forms import EmailPostForm, CommentForm
from django.core.mail import send_mail
from taggit.models import Tag
from django.db.models import Count
from .utils import split_and_randomize_similar_posts

from decouple import config

# Create your views here.


class PostListView(ListView):
    queryset = Post.published.all()
    context_object_name = "posts"
    paginate_by = 7
    template_name = "blog/post/list.html"


def post_list(request, tag_slug=None):
    post_list = Post.published.all()
    tags = None
    if tag_slug:
        # Split the tag_slug by comma to get multiple tags
        tag_slugs = [slug.strip() for slug in tag_slug.split(",")]
        tags = Tag.objects.filter(slug__in=tag_slugs)
        if tags:
            post_list = post_list.filter(tags__in=tags).distinct()

    paginator = Paginator(post_list, 7)
    page_number = request.GET.get("page", 1)

    try:
        posts = paginator.page(page_number)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)

    return render(
        request,
        "blog/post/list.html",
        {
            "posts": posts,
            "tags": tags,
        },
    )


def post_detail(request, year, month, day, post):
    post = get_object_or_404(
        Post,
        status=Post.Status.PUBLISHED,
        slug=post,
        publish__year=year,
        publish__month=month,
        publish__day=day,
    )

    comments = post.comments.filter(active=True)

    form = CommentForm()

    # Similar posts

    post_tags_ids = post.tags.values_list("id", flat=True)
    similar_posts = (
        Post.published.filter(tags__in=post_tags_ids).exclude(id=post.id).distinct()
    )
    similar_posts = similar_posts.annotate(same_tags=Count("tags")).order_by(
        "-same_tags"
    )
    similar_posts = split_and_randomize_similar_posts(similar_posts)
    # similar_posts = similar_posts.annotate(same_tags=Count("tags")).order_by(
    #     "-same_tags", "-publish"
    # )[:3]

    return render(
        request,
        "blog/post/detail.html",
        {
            "post": post,
            "form": form,
            "comments": comments,
            "similar_posts": similar_posts,
        },
    )


def post_share(request, post_id):
    post = get_object_or_404(Post, id=post_id, status=Post.Status.PUBLISHED)
    sent = False
    if request.method == "POST":
        form = EmailPostForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            post_url = request.build_absolute_uri(post.get_absolute_url())

            subject = f"{cd['name']} ({cd['email']}) recommends you read {post.title}"
            message = (
                f"Read {post.title} at {post_url}\n\n"
                f"{cd['name']}'s comments: {cd['comments']}"
            )

            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[cd["to"]],
            )
            sent = True

    else:
        form = EmailPostForm()

    return render(
        request,
        "blog/post/share.html",
        {
            "post": post,
            "form": form,
            "sent": sent,
        },
    )


@require_POST
def post_comment(request, post_id):
    post = get_object_or_404(
        Post,
        id=post_id,
        status=Post.Status.PUBLISHED,
    )
    comment = None

    form = CommentForm(data=request.POST)
    if form.is_valid():
        comment = form.save(commit=False)

        comment.post = post

        comment.save()

    return render(
        request,
        "blog/post/comment.html",
        {
            "post": post,
            "form": form,
            "comment": comment,
        },
    )


def password_required(request):
    error = None
    next_url = next_url = request.GET.get("next") or request.POST.get("next") or "/blog"
    if request.method == "POST":
        # Replace 'correct_password' with your actual password or configuration setting.
        if request.POST.get("password") == config("REFERRER_PASSWORD"):
            request.session["password_authenticated"] = True
            # Redirect to the original page or a default page.
            return redirect(next_url)
        else:
            error = "Incorrect password. Please try again."
    return render(request, "blog/password_required.html", {"error": error})
