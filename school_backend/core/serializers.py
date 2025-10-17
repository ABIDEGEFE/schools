from rest_framework import serializers
from . import models
import uuid


class SchoolSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.School
		# include additional contact and counts fields the frontend needs
		fields = [
			'id', 'name', 'status', 'address',
			'contact_email', 'contact_phone', 'number_of_students', 'number_of_teachers'
		]
		# read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
	school = SchoolSerializer(read_only=True)
	# Accept schoolId from frontend (camelCase) when creating/updating a user
	schoolId = serializers.CharField(write_only=True, required=False, allow_null=True)
	# Make username optional on input; we'll generate one if missing
	username = serializers.CharField(required=False, allow_blank=True)
	password = serializers.CharField(write_only=True, required=False, default="password123")

	class Meta:
		model = models.User
		# include fields the frontend expects from the mock data
		fields = ['id', 'username', 'name', 'email', 'role', 'school', 'schoolId', 'status', 'is_licensed', 'wins', 'profile_picture', 'password']
		read_only_fields = ['id']


	def _resolve_school(self, school_id):
		if not school_id:
			return None
		try:
			return models.School.objects.get(id=school_id)
		except models.School.DoesNotExist:
			raise serializers.ValidationError({'schoolId': 'School with this id does not exist.'})

	def create(self, validated_data):
		school_id = validated_data.pop('schoolId', None)
		if school_id:
			validated_data['school'] = self._resolve_school(school_id)

		# Auto-generate id if missing (use UUID to avoid DB schema changes)
		if not validated_data.get('id'):
			validated_data['id'] = str(uuid.uuid4())

		# Ensure username exists (AbstractUser requires it)
		if not validated_data.get('username'):
			validated_data['username'] = validated_data.get('email') or validated_data.get('name') or validated_data['id']

		# Set sensible defaults if fields are missing
		if 'status' not in validated_data:
			validated_data['status'] = models.User.STATUS_YELLOW
		if 'is_licensed' not in validated_data:
			validated_data['is_licensed'] = False
		if 'wins' not in validated_data:
			validated_data['wins'] = 0

		# Handle password if provided; otherwise set unusable password after creation
		password = validated_data.pop('password', None)
	
		user = super().create(validated_data)
		if password:
			user.set_password(password)
			print("Password set for user:", password)
		else:
			user.set_unusable_password()
		user.save()
		return user

	def update(self, instance, validated_data):
		school_id = validated_data.pop('schoolId', None)
		if school_id is not None:
			instance.school = self._resolve_school(school_id)

		# Handle password update if provided
		password = validated_data.pop('password', None)
		user = super().update(instance, validated_data)
		if password:
			user.set_password(password)
			user.save()
		return user


class ExamSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.Exam
		fields = ['id', 'subject', 'date', 'duration', 'number_of_questions']


class QuestionSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.Question
		fields = ['id', 'text', 'options', 'correct_answer']


class AnnouncementSerializer(serializers.ModelSerializer):
	school = SchoolSerializer(read_only=True)
	author = UserSerializer(read_only=True)

	# Accept write-only fields for creation
	schoolId = serializers.CharField(write_only=True, required=False, allow_null=True)
	authorId = serializers.CharField(write_only=True, required=False, allow_null=True)

	class Meta:
		model = models.Announcement
		fields = ['title', 'content', 'school', 'schoolId', 'author', 'authorId', 'created_at', 'urgent']

	def _resolve_school(self, school_id):
		if not school_id:
			return None
		try:
			return models.School.objects.get(id=school_id)
		except models.School.DoesNotExist:
			raise serializers.ValidationError({'schoolId': 'School with this id does not exist.'})

	def _resolve_author(self, author_id):
		if not author_id:
			return None
		try:
			return models.User.objects.get(id=author_id)
		except models.User.DoesNotExist:
			raise serializers.ValidationError({'authorId': 'User with this id does not exist.'})

	def create(self, validated_data):
		school_id = validated_data.pop('schoolId', None)
		author_id = validated_data.pop('authorId', None)

		if school_id:
			validated_data['school'] = self._resolve_school(school_id)
		else:
			validated_data['school'] = None

		if author_id:
			validated_data['author'] = self._resolve_author(author_id)
		# Auto-generate id
		if not validated_data.get('id'):
			validated_data['id'] = str(uuid.uuid4())
		return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
	author = UserSerializer(read_only=True)

	class Meta:
		model = models.Comment
		fields = ['id', 'material', 'author', 'author_name', 'content', 'created_at']


class MaterialSerializer(serializers.ModelSerializer):
	seller = UserSerializer(read_only=True)
	comments = CommentSerializer(many=True, read_only=True)

	class Meta:
		model = models.Material
		fields = ['id', 'title', 'subject', 'price', 'description', 'chapter', 'seller', 'upvotes', 'downvotes', 'comments']


class MessageSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)
	receiver = UserSerializer(read_only=True)

	class Meta:
		model = models.Message
		fields = ['id', 'sender', 'receiver', 'content', 'timestamp', 'read', 'conversation']


class ConversationSerializer(serializers.ModelSerializer):
	participants = UserSerializer(many=True, read_only=True)
	last_message = MessageSerializer(read_only=True)

	class Meta:
		model = models.Conversation
		fields = ['id', 'participants', 'last_message', 'unread_count']


class CompetitionSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)
	receiver = UserSerializer(read_only=True)

	senderId = serializers.CharField(write_only=True, required=False)
	receiverId = serializers.CharField(write_only=True, required=False)

	class Meta:
		model = models.Competition
		fields = ['id', 'sender', 'receiver', 'status', 'scheduled_date', 'school', 'senderId', 'receiverId', 'created_at', 'updated_at']
		read_only_fields = ['id', 'created_at', 'updated_at']

	def _resolve_user(self, user_id):
		if not user_id:
			return None
		try:
			return models.User.objects.get(id=user_id)
		except models.User.DoesNotExist:
			raise serializers.ValidationError({'user': 'User with this id does not exist.'})

	def create(self, validated_data):
		sender_id = validated_data.pop('senderId', None)
		receiver_id = validated_data.pop('receiverId', None)

		if sender_id:
			validated_data['sender'] = self._resolve_user(sender_id)
		if receiver_id:
			validated_data['receiver'] = self._resolve_user(receiver_id)

		# Auto-generate id if missing
		if not validated_data.get('id'):
			import uuid
			validated_data['id'] = str(uuid.uuid4())

		return super().create(validated_data)

	def update(self, instance, validated_data):
		# allow setting scheduled_date and status via partial update
		sender_id = validated_data.pop('senderId', None)
		receiver_id = validated_data.pop('receiverId', None)
		if sender_id:
			instance.sender = self._resolve_user(sender_id)
		if receiver_id:
			instance.receiver = self._resolve_user(receiver_id)
		return super().update(instance, validated_data)

