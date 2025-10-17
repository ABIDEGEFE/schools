from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

class School(models.Model):
	STATUS_ACTIVE = 'active'
	STATUS_INACTIVE = 'inactive'
	STATUS_CHOICES = [
		(STATUS_ACTIVE, 'Active'),
		(STATUS_INACTIVE, 'Inactive'),
	]

	id = models.CharField(max_length=36, primary_key=True, auto_created=True)
	name = models.CharField(max_length=255)
	status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
	address = models.TextField(blank=True)
	contact_email = models.EmailField(blank=True)
	contact_phone = models.CharField(max_length=20, blank=True)
	number_of_students = models.IntegerField(default=0)
	number_of_teachers = models.IntegerField(default=0)

	def __str__(self):
		return f"{self.name} ({self.id})"


class User(AbstractUser):
	ROLE_ADMIN = 'AD'
	ROLE_TEACHER = 'TC'
	ROLE_STUDENT = 'ST'
	ROLE_SUPER_ADMIN = 'SA'
	ROLE_CHOICES = [
		(ROLE_ADMIN, 'Admin'),
		(ROLE_TEACHER, 'Teacher'),
		(ROLE_STUDENT, 'Student'),
		(ROLE_SUPER_ADMIN, 'Super Admin'),
	]

	STATUS_GREEN = 'green'
	STATUS_YELLOW = 'yellow'
	STATUS_RED = 'red'
	STATUS_CHOICES = [
		(STATUS_GREEN, 'Green'),
		(STATUS_YELLOW, 'Yellow'),
		(STATUS_RED, 'Red'),
	]

	id = models.CharField(max_length=36, primary_key=True)
	name = models.CharField(max_length=255)
	email = models.EmailField(unique=True)
	role = models.CharField(max_length=2, choices=ROLE_CHOICES)
	school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='users')
	status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_GREEN)
	is_licensed = models.BooleanField(default=False)
	wins = models.IntegerField(default=0)
	profile_picture = models.URLField(blank=True, null=True)

	def __str__(self):
		return f"{self.name} ({self.email})"


class Exam(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	subject = models.CharField(max_length=255)
	date = models.DateField()
	duration = models.IntegerField(help_text='Duration in minutes')
	number_of_questions = models.IntegerField()

	def __str__(self):
		return f"{self.subject} on {self.date}"


class Question(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	text = models.TextField()
	options = models.JSONField(default=list)  # list of option strings
	correct_answer = models.IntegerField()

	def __str__(self):
		return f"Question {self.id}: {self.text[:40]}"


class Announcement(models.Model):
	id = models.CharField(max_length=36, primary_key=True, auto_created=True)
	title = models.CharField(max_length=255)
	content = models.TextField()
	# Make school optional: if null, announcement is considered system-wide/public
	school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
	author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='announcements')
	created_at = models.DateTimeField(default=timezone.now)
	urgent = models.BooleanField(default=False)

	def __str__(self):
		return f"{self.title} ({'URGENT' if self.urgent else 'normal'})"


class Material(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	title = models.CharField(max_length=255)
	subject = models.CharField(max_length=255)
	price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
	description = models.TextField(blank=True)
	chapter = models.CharField(max_length=255, blank=True)
	seller = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='materials')
	upvotes = models.IntegerField(default=0)
	downvotes = models.IntegerField(default=0)

	def __str__(self):
		return f"{self.title} - {self.subject}"


class Comment(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='comments')
	author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='comments')
	author_name = models.CharField(max_length=255)
	content = models.TextField()
	created_at = models.DateTimeField(default=timezone.now)

	def __str__(self):
		return f"Comment by {self.author_name} on {self.material_id}"


class Message(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
	receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
	content = models.TextField()
	timestamp = models.DateTimeField(default=timezone.now)
	read = models.BooleanField(default=False)
	# optional link back to a conversation
	conversation = models.ForeignKey('Conversation', on_delete=models.CASCADE, null=True, blank=True, related_name='messages')

	def __str__(self):
		return f"Message {self.id} from {self.sender_id} to {self.receiver_id}"


class Conversation(models.Model):
	id = models.CharField(max_length=36, primary_key=True)
	participants = models.ManyToManyField(User, related_name='conversations')
	last_message = models.ForeignKey(Message, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
	unread_count = models.IntegerField(default=0)

	def __str__(self):
		return f"Conversation {self.id} ({self.participants.count()} participants)"


class Competition(models.Model):
	STATUS_NONE = 'none'
	STATUS_PENDING = 'pending'
	STATUS_ACCEPTED = 'accepted'
	STATUS_SCHEDULED = 'scheduled'
	STATUS_CHOICES = [
		(STATUS_NONE, 'None'),
		(STATUS_PENDING, 'Pending'),
		(STATUS_ACCEPTED, 'Accepted'),
		(STATUS_SCHEDULED, 'Scheduled'),
	]

	id = models.CharField(max_length=36, primary_key=True)
	sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_competitions')
	receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_competitions')
	status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
	scheduled_date = models.DateTimeField(null=True, blank=True)
	school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='competitions')
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Competition {self.id}: {self.sender_id} -> {self.receiver_id} ({self.status})"

