from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path
from school_backend.views import (
    LoginView,
    SchoolUsersView,
    UserUpdateView,
    UserRegisterView,
    SchoolListView,
    StatusUserListView,
    MessageListView,
)

router = DefaultRouter()
router.register(r'schools', views.SchoolViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'exams', views.ExamViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'announcements', views.AnnouncementViewSet)
router.register(r'materials', views.MaterialViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'conversations', views.ConversationViewSet)

urlpatterns = router.urls
urlpatterns += [
    path('login/<str:schoolID>/', LoginView.as_view(), name='login'),
    path('schools/<str:school_id>/users/', SchoolUsersView.as_view(), name='school-users'),
    path('update/users/<str:id>/', UserUpdateView.as_view(), name='user-detail'),
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('delete/users/<str:id>/', views.DeleteUserView.as_view(), name='user-delete'),
    path('schools/', SchoolListView.as_view(), name='school-list'),
    path('users/status/<str:status>/<str:school_id>/', StatusUserListView.as_view(), name='user-status-list'),
    path('messages/history/<str:other_user_id>/', MessageListView.as_view(), name='message-history'),
]

# `http://localhost:8000/api/schools/${schoolId}/users/`
# http://localhost:8000/api/users/${id}/
# http://localhost:8000/api/register/'
# 'http://localhost:8000/api/schools/'
# http://localhost:8000/api/users/status/${status}/
