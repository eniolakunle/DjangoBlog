from taggit.models import Tag


def all_tags(request):
    return {"all_tags": [tag.name for tag in Tag.objects.all()]}
