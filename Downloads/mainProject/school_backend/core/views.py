from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from . import models, serializers


class ReadOnlyOrCreatePermission(permissions.BasePermission):
	"""Simple permission: allow read-only to all, but require authentication for unsafe methods."""

	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		return request.user and request.user.is_authenticated


class SchoolViewSet(viewsets.ModelViewSet):
	queryset = models.School.objects.all()
	serializer_class = serializers.SchoolSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class UserViewSet(viewsets.ModelViewSet):
	queryset = models.User.objects.all()
	serializer_class = serializers.UserSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class ExamViewSet(viewsets.ModelViewSet):
	queryset = models.Exam.objects.all()
	serializer_class = serializers.ExamSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class QuestionViewSet(viewsets.ModelViewSet):
	queryset = models.Question.objects.all()
	serializer_class = serializers.QuestionSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class AnnouncementViewSet(viewsets.ModelViewSet):
	queryset = models.Announcement.objects.all()
	serializer_class = serializers.AnnouncementSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class MaterialViewSet(viewsets.ModelViewSet):
	queryset = models.Material.objects.all()
	serializer_class = serializers.MaterialSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class CommentViewSet(viewsets.ModelViewSet):
	queryset = models.Comment.objects.all()
	serializer_class = serializers.CommentSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class MessageViewSet(viewsets.ModelViewSet):
	queryset = models.Message.objects.all()
	serializer_class = serializers.MessageSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class ConversationViewSet(viewsets.ModelViewSet):
	queryset = models.Conversation.objects.all()
	serializer_class = serializers.ConversationSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class DeleteUserView(APIView):
	"""Handle deletion of a user by id. Only allow DELETE and require authentication."""
	# permission_classes = [permissions.IsAuthenticated]

	def delete(self, request, id):
		print("DeleteUserView called with id:", id)
		try:
			user = models.User.objects.get(id=id)
		except models.User.DoesNotExist:
			return Response({'error': 'User not found'}, status=404)

		# Optionally prevent deleting superusers or the requesting user
		if user.is_superuser:
			return Response({'error': 'Cannot delete a superuser'}, status=403)
		if request.user.id == user.id:
			return Response({'error': "You cannot delete your own account"}, status=403)

		user.delete()
		return Response({'status': 'deleted'}, status=204)

