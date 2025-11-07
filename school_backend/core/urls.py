from rest_framework.routers import DefaultRouter
from . import views
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
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
router.register(r'competitions', views.CompetitionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Legacy/custom endpoints consolidated into core.views
]
 
