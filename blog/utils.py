import random

from blog.models import PublishedManager


def split_and_randomize_similar_posts(similar_posts: PublishedManager):
    count = similar_posts.count()
    max_amount_of_posts_to_show = 4
    size = count // max_amount_of_posts_to_show
    remainder = count % max_amount_of_posts_to_show

    # Split similar posts into sub arrays, sub arrays will articles that are most similarly tagged
    # Basically there will be the first post will be a random article with high similarity, and so forth
    # until the fourth article is a random one with the lowest similarity.
    sub_arrays = []
    start = 0
    for i in range(max_amount_of_posts_to_show):
        end = start + size + (1 if i < remainder else 0)
        sub_array = similar_posts[start:end]
        if sub_array:
            sub_arrays.append(sub_array)
        start = end

    result = []
    for sub_array in sub_arrays:
        random_article = random.choice(sub_array)
        result.append(random_article)
    return result
