from core.serializers import UserSerializer, SchoolSerializer, MaterialSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
import jwt, datetime
from core.models import User, School, Message
from django.db import models as models
from school_backend.settings import SECRET_KEY



class LoginView(APIView):
    def post(self, request, schoolID):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
            # Use Django's password hasher check to validate the password.
            # This avoids problems when authenticate() expects a different username field.
            if user.check_password(password):  # In production, use check_password method
                print("Password is valid for user:", user.email, user.id)
                payload = {
                    'schoolID': user.school.id if user.school else None,
                    'id': user.id,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
                    'iat': datetime.datetime.utcnow()
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
                
                # Ensure the user belongs to the selected school
                user_school_id = None
                if user.school:
                    # use the FK directly to avoid depending on serializer shape
                    user_school_id = str(user.school.id)

                if user_school_id != str(schoolID):
                    return Response({'error': 'User does not belong to the specified school'}, status=403)
                serialized_user = UserSerializer(user).data

                return Response({'token': token, 'user': serialized_user}, status=200)
            else:
                print("Invalid password")
                return Response({'error': 'Invalid credentials'}, status=401)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
class SchoolUsersView(APIView):
    def get(self, request, school_id):
        users = User.objects.filter(school_id=school_id)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
class UserUpdateView(APIView):
    def put(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=400)
    
class SchoolListView(APIView):
    def get(self, request):
        try:
            school = School.objects.all()
            serializer = SchoolSerializer(school, many=True)
            print('schools', serializer.data)
            return Response(serializer.data)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)
        
class StatusUserListView(APIView):
    def get(self, request, status, school_id):
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=401)

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return Response({'error': 'Invalid token'}, status=401)

        users = User.objects.filter(status=status , school_id=school_id)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
class MessageListView(APIView):
    """
    GET /api/messages/history/<other_user_id>/
    Returns the message history between the authenticated user (from JWT) and the other_user_id.
    """
    def get(self, request, other_user_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing or invalid'}, status=401)

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return Response({'error': 'Invalid token'}, status=401)

        # Determine requester from token
        requester_id = payload.get('id')
        if not requester_id:
            return Response({'error': 'Invalid token payload'}, status=401)

        try:
            other = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'Other user not found'}, status=404)

        # Messages where (sender=requester and receiver=other) OR (sender=other and receiver=requester)
        messages = Message.objects.filter(
            (models.Q(sender_id=requester_id) & models.Q(receiver_id=other_user_id)) |
            (models.Q(sender_id=other_user_id) & models.Q(receiver_id=requester_id))
        ).order_by('timestamp')

        from core.serializers import MessageSerializer

        serializer = MessageSerializer(messages, many=True)
        print("Message history between", requester_id, "and", other_user_id, ":", serializer.data)
        return Response(serializer.data)



