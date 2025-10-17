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
	def create(self, request, *args, **kwargs):
		# Override to auto-generate ID if not provided
		if not request.data.get('id'):
			import uuid
			request.data['id'] = str(uuid.uuid4())
		return super().create(request, *args, **kwargs)
	# permission_classes = [ReadOnlyOrCreatePermission]
	# permission_classes = [ReadOnlyOrCreatePermission]
	# update information
	def update(self, request, *args, **kwargs):
		partial = True
		print("Partial update:", partial)
		instance = self.get_object()
		# print("Instance to update:", instance)
		serializer = self.get_serializer(instance, data=request.data, partial=partial)
		print("SchoolViewSet serializer data last:", serializer.initial_data)
		try:
			if serializer.is_valid(raise_exception=True):
				self.perform_update(serializer)
			else:
				print("SchoolViewSet serializer errors:", serializer.errors)
				return Response(serializer.errors, status=400)
		except Exception as exc:
			# Return validation errors or other exceptions as a 400 response
			print('SchoolViewSet.update error:', str(exc))
			return Response({'detail': str(exc)}, status=400)

		# Ensure the instance is fresh if signals or related fields changed
		instance.refresh_from_db()
		return Response(serializer.data)
		
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
	# permission_classes = [ReadOnlyOrCreatePermission]

	def create(self, request, *args, **kwargs):
		# Use the serializer to validate and save
		# print("AnnouncementViewSet create called with data:", request.data)
		serializer = self.get_serializer(data=request.data)
		print("AnnouncementViewSet serializer data:", serializer.initial_data)
		if serializer.is_valid():
			print("AnnouncementViewSet serializer is valid")
			announcement = serializer.save()
			
		else:
			print("AnnouncementViewSet serializer errors:", serializer.errors)
			return Response(serializer.errors, status=400)	
		announcement = serializer.save()
    
		# Broadcast over channels for real-time delivery
		print("Broadcasting announcement:", announcement)
		try:
			from asgiref.sync import async_to_sync
			from channels.layers import get_channel_layer
			channel_layer = get_channel_layer()
			payload = {
				'type': 'announcement_message',
				'announcement': serializers.AnnouncementSerializer(announcement).data,
			}

			if announcement.school is None:
				print("Announcement has no school, broadcasting to global group")
				async_to_sync(channel_layer.group_send)('announcements', payload)
			else:
				print("Announcement has school, broadcasting to school group:", announcement.school.id)
				school_group = f'announcements_school_{announcement.school.id}'
				async_to_sync(channel_layer.group_send)(school_group, payload)
		
		except Exception as e:
			print('Failed to broadcast announcement from ViewSet:', str(e))

		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data, status=201, headers=headers)


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


class CompetitionViewSet(viewsets.ModelViewSet):
	queryset = models.Competition.objects.all()
	
	serializer_class = serializers.CompetitionSerializer
	
	# permission_classes = [ReadOnlyOrCreatePermission]

    
	def perform_broadcast(self, competition):
		try:
			from asgiref.sync import async_to_sync
			from channels.layers import get_channel_layer
			channel_layer = get_channel_layer()
			payload = {
				'type': 'competition_update',
				'competition': serializers.CompetitionSerializer(competition).data,
			}
			# send to both participants' personal groups
			async_to_sync(channel_layer.group_send)(f'user_{competition.sender.id}', payload)
			async_to_sync(channel_layer.group_send)(f'user_{competition.receiver.id}', payload)
		except Exception as e:
			print('Failed to broadcast competition update:', str(e))

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		sender = request.query_params.get('sender')
		
		receiver = request.query_params.get('receiver')
		
		if sender:
			queryset = queryset.filter(sender__id=sender)
		if receiver:
			queryset = queryset.filter(receiver__id=receiver)
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		# print('ddddCompetition list response data:', serializer.data)
		return Response(serializer.data)
	def create(self, request, *args, **kwargs):
		# Expect senderId and receiverId in payload
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		competition = serializer.save()
		self.perform_broadcast(competition)
		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data, status=201, headers=headers)

	def partial_update(self, request, *args, **kwargs):
		print('this is partial update competition')
		# Use partial updates for status transitions
		partial = True
		instance = self.get_object()
		serializer = self.get_serializer(instance, data=request.data, partial=partial)
		serializer.is_valid(raise_exception=True)
		competition = serializer.save()
		self.perform_broadcast(competition)
		print('Competition partial_update response data:', serializer.data)
		return Response(serializer.data)

	# Custom actions could be implemented as separate endpoints, but partial_update covers cancel/accept/reject/schedule


class StatusSchoolListView(APIView):
	"""Return schools filtered by status (active/inactive)."""
	def get(self, request, status):
		if status not in (models.School.STATUS_ACTIVE, models.School.STATUS_INACTIVE):
			return Response({'error': 'Invalid status'}, status=400)
		schools = models.School.objects.filter(status=status)
		serializer = serializers.SchoolSerializer(schools, many=True)
		return Response(serializer.data)


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

