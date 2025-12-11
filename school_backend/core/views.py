from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from django.contrib.auth import login, logout, authenticate
from rest_framework.response import Response
from rest_framework.decorators import action
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from . import models, serializers
import jwt, datetime
from django.conf import settings
from django.db import models as django_models


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
	def create(self, request, *args, **kwargs):
		if not request.data.get('id'):
			import uuid
			request.data['id'] = str(uuid.uuid4())
		return super().create(request, *args, **kwargs)
	
	@action(detail=False, methods=['get'], url_path=r'get_schools_by_status/(?P<status>[^/.]+)')
	def get_schools_by_status(self, request, status=None):
		qs = self.queryset.filter(status=status)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)
		
class UserViewSet(viewsets.ModelViewSet):
	queryset = models.User.objects.all()
	serializer_class = serializers.UserSerializer
	# permission_classes = [ReadOnlyOrCreatePermission]

    
	print('this is user viewsetttttttttttttt why am i here')

	@action(detail=False, methods=['post'])
	def login_view(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		print("Login attempt for username:", username)
		user = authenticate(request, username=username, password=password)
		print("Authenticationnnnnnnnnnnnnnnnn result:", user)
		if user is not None:
			print("User authenticated successfully:", user)
			login(request, user)
			user = request.user
			# Make sure session is saved and cookie is set
			request.session.save()
			serialized_user = serializers.UserSerializer(user).data
			resp = Response({'user': serialized_user}, status=200)
			resp.set_cookie(
				settings.SESSION_COOKIE_NAME,
				request.session.session_key,
				httponly=True,
				secure=False,
				samesite='Lax',
				path='/'
			)
			return resp
		print("Getting user info for user:", user)
		if user and user.is_authenticated:
			serialized_user = serializers.UserSerializer(user).data
			resp = Response({'user': serialized_user}, status=200)
			resp.set_cookie(
				settings.SESSION_COOKIE_NAME,
				request.session.session_key,
				http_only=True,
				secure=False,
				samesite='Lax',
				path='/'
			)
			return resp
		return Response({'detail': 'Unauthorizedddddd'}, status=401)
	
	@method_decorator(csrf_exempt)
	@action(detail=False, methods=['post'])
	def logout_view(self,request):
		try:
			print("Logout called for user:", request.user)
			# Flush session data and invalidate the session id
			request.session.flush()
			logout(request)
			resp = Response({'detail': 'Logged out'}, status=200)
			# Remove session cookie so browser no longer presents stale id
			resp.delete_cookie(
				settings.SESSION_COOKIE_NAME,
				path='/',
				samesite='Lax',
				secure=False,
				httponly=True,
			)
			return resp
		except Exception as e:
			print('logout failed in one or another casessssssss')
			return Response({'detail': f'Logout failed: {e}'}, status=400)
			

	@action(detail=False, methods=['get'], url_path=r'get_users_by_school/(?P<school_id>[^/.]+)')
	def get_users_by_school(self, request, school_id=None):
		qs = self.queryset.filter(school_id=school_id)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)
	
	@action(detail=False, methods=['get'], url_path=r'get_user_by_status/(?P<school_id>[^/.]+)/(?P<status>[^/.]+)')
	def get_user_by_status(self, request, school_id=None, status=None):
		qs = self.queryset.filter(school_id=school_id, status=status)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=['get'])
	def get_user_info(self, request):
		print("get_user_info called", request)
		user = request.user
		print("Getting user info for user:", user)
		if user.is_authenticated:
			serialized_user = serializers.UserSerializer(user).data
			return Response({'user': serialized_user}, status=200)
		return Response({'detail': 'Unauthorized'}, status=401)
	



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
			print("Prepared payload for announcement broadcast:", payload)

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

	@action(detail=False, methods=['get'], url_path=r'get_messages_between/(?P<user1_id>[^/.]+)/(?P<user2_id>[^/.]+)')
	def get_messages_between(self, request, user1_id=None, user2_id=None):
		qs = self.queryset.filter(
			(django_models.Q(sender_id=user1_id) & django_models.Q(receiver_id=user2_id)) |
			(django_models.Q(sender_id=user2_id) & django_models.Q(receiver_id=user1_id))
		).order_by('timestamp')
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)


class ConversationViewSet(viewsets.ModelViewSet):
	queryset = models.Conversation.objects.all()
	serializer_class = serializers.ConversationSerializer
	permission_classes = [ReadOnlyOrCreatePermission]


class CompetitionViewSet(viewsets.ModelViewSet):
	queryset = models.Competition.objects.all()
	
	serializer_class = serializers.CompetitionSerializer
	print('this is competition viewsetttttttttttttt')
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
			print('Broadcasted competition update for competition id:', competition.id)
		except Exception as e:
			print('Failed to broadcast competition update:', str(e))

	def list(self, request, *args, **kwargs):
		print('this is list competitionttttttttttttt')
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
		# print('this is competition list response data:', serializer.data)
		return Response(serializer.data)
	def create(self, request, *args, **kwargs):
		# Expect senderId and receiverId in payload
		print('this is create competitioncccccccccccccc')
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		competition = serializer.save()
		self.perform_broadcast(competition)
		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data, status=201, headers=headers)

	def partial_update(self, request, *args, **kwargs):
		print('this is partial update competitionnnnnnnnnnnnn')
		try:
			print('partial_update called: method=', request.method, 'user=', getattr(request, 'user', None))
			print('Authorization header:', request.headers.get('Authorization'))
			print('Request data:', request.data)
		except Exception as e:
			print('Error printing partial_update debug info', str(e))
		# Use partial updates for status transitions
		partial = True
		instance = self.get_object()
		serializer = self.get_serializer(instance, data=request.data, partial=partial)
		serializer.is_valid(raise_exception=True)
		competition = serializer.save()

		# If the competition was just accepted, schedule it 1 minute later and mark as scheduled
		try:
			# If status is accepted or already scheduled but has no scheduled_date, set scheduled_date
			if competition.status in (models.Competition.STATUS_ACCEPTED, models.Competition.STATUS_SCHEDULED):
				# only schedule if not already scheduled
				if not competition.scheduled_date:
					from django.utils import timezone
					competition.status = models.Competition.STATUS_SCHEDULED
					competition.scheduled_date = timezone.now() + datetime.timedelta(minutes=1)
					competition.save()
					# broadcast the updated competition
					self.perform_broadcast(competition)
		except Exception as e:
			print('Error scheduling competition after accept:', str(e))

		# final broadcast for any remaining updates
		self.perform_broadcast(competition)
		print('Competition partial_update response data:', self.get_serializer(competition).data)
		return Response(self.get_serializer(competition).data)

	# Custom actions could be implemented as separate endpoints, but partial_update covers cancel/accept/reject/schedule


class StatusSchoolListView(APIView):
	"""Return schools filtered by status (active/inactive)."""
	def get(self, request, status):
		if status not in (models.School.STATUS_ACTIVE, models.School.STATUS_INACTIVE):
			return Response({'error': 'Invalid status'}, status=400)
		schools = models.School.objects.filter(status=status)
		serializer = serializers.SchoolSerializer(schools, many=True)
		return Response(serializer.data)


