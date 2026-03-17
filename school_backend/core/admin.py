from django.contrib import admin
from .models import School, User, Exam, Question, Announcement, Material, Comment, Conversation, Message
# Register your models here.
admin.site.register(School)
admin.site.register(User)
admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(Announcement)
admin.site.register(Material)
admin.site.register(Comment)
admin.site.register(Conversation)
admin.site.register(Message)
