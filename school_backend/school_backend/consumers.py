import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from core.models import Message
import jwt
from school_backend.settings import SECRET_KEY


User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query params
        self.token = self.scope['query_string'].decode().split('token=')[-1]
        try:
            payload = jwt.decode(self.token, SECRET_KEY, algorithms=['HS256'])
            self.user = await database_sync_to_async(User.objects.get)(id=payload['id'])
            print(f"WebSocket connection authenticated for user: {self.user.email}, ID: {self.user.id}")
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist) as e:
            print(f"WebSocket connection failed authentication: {str(e)}")
            await self.close()
            return

        self.selected_user_id = self.scope['url_route']['kwargs']['selected_user_id']
        self.user_group_name = f'chat_{max(self.user.id, self.selected_user_id)}_{min(self.user.id, self.selected_user_id)}'

        # Join user's group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket connection accepted for user: {self.user.email}, ID: {self.user.id}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        recipient_id = data.get('recipientId') or data.get('recipient_id')
        recipient_obj = await self.get_target_user(recipient_id)
        print(f"Received message from {recipient_obj} to {self.user}: {message}")
        if not message or not recipient_id:
            # ignore malformed messages
            return

        # Save message to DB and obtain serialized payload
        saved = await self.save_message(self.user.id, recipient_id, message)

        payload = {
            'type': 'chat_message',
            'message': saved['content'],
            'senderId': saved['sender_id'],
            'receiverId': saved['receiver_id'],
            'timestamp': saved['timestamp'],
            'id': saved['id'],
        }

        # Send to recipient group and sender group so both sides get the message
        # recipient_group = f'chat_{recipient_id}'
        # await self.channel_layer.group_send(recipient_group, payload)
        await self.channel_layer.group_send(self.user_group_name, payload)

    async def chat_message(self, event):
        # Forward the event payload to WebSocket client
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_target_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        
    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        try:
            sender = User.objects.get(id=sender_id)
        except User.DoesNotExist:
            sender = None
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            receiver = None

        msg = Message.objects.create(
            id=str(uuid.uuid4()),
            sender=sender,
            receiver=receiver,
            content=content
        )
        # Optionally, update/create a Conversation for these two users
        # For now, we won't create conversations automatically to keep behaviour simple
        return {
            'id': msg.id,
            'sender_id': msg.sender.id if msg.sender else None,
            'receiver_id': msg.receiver.id if msg.receiver else None,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
        }
    
# AnnouncementConsumer for broadcasting announcements to all connected users
class AnnouncementConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query params
        self.token = self.scope['query_string'].decode().split('token=')[-1]
        try:
            payload = jwt.decode(self.token, SECRET_KEY, algorithms=['HS256'])
            self.user = await database_sync_to_async(User.objects.get)(id=payload['id'])
            print(f"WebSocket connection authenticated for user: {self.user.email}, ID: {self.user.id}")
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist) as e:
            print(f"WebSocket connection failed authentication: {str(e)}")
            await self.close()
            return
        print("User authenticated successfully in AnnouncementConsumer:", self.user.email, self.user.school_id)
        # Join global announcements group
        self.group_name = 'announcements'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
   


        # Also join a school-specific announcements group if the user belongs to a school
        self.school_group = None
        try:
            school_id = getattr(self.user, 'school_id', None)
            print("User's school IDdddddddddddd:", school_id)
            if school_id:
                self.school_group = f'announcements_school_{school_id}'
                await self.channel_layer.group_add(self.school_group, self.channel_name)
        except Exception as e:
            self.school_group = None

        await self.accept()
        print(f"WebSocket connection accepted for user: {self.user.email}, ID: {self.user.id}")

    async def disconnect(self, close_code):
        # Leave global announcements group
        try:
            print(f"Disconnecting from group: {self.group_name}")
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass
        # Leave school-specific group if present
        if getattr(self, 'school_group', None):
            try:
                print(f"Disconnecting from school group: {self.school_group}")
                await self.channel_layer.group_discard(self.school_group, self.channel_name)
            except Exception:
                pass
   
    async def receive(self, text_data):
        print("AnnouncementConsumer received data:", text_data)
        data = json.loads(text_data)
        announcement = data.get('announcement', '')
        print(f"Received announcement: {announcement}")
        if not announcement:
            print("No announcement content provided, ignoring.")
            return

        payload = {
            'type': 'announcement_message',
            'announcement': announcement,
            'timestamp': str(uuid.uuid4()),  # Placeholder timestamp
        }

        # Broadcast to all connected users
        # await self.channel_layer.group_send(self.group_name, payload)
        # await self.channel_layer.group_send(self.school_group, payload)
    print('this is after receive')
    async def announcement_message(self, event):
        # Forward the event payload to WebSocket client
        await self.send(text_data=json.dumps(event))
        print('message has been sent now')


class UserConsumer(AsyncWebsocketConsumer):
    """Generic per-user consumer: joins a personal group `user_{id}` so server can send user-targeted events
    Expected to receive group messages with 'type': 'competition_update' and 'competition' payload.
    """
    async def connect(self):
        # extract token from query string
        self.token = self.scope['query_string'].decode().split('token=')[-1]
        try:
            payload = jwt.decode(self.token, SECRET_KEY, algorithms=['HS256'])
            self.user = await database_sync_to_async(User.objects.get)(id=payload['id'])
            print(f"UserConsumer authenticated: {self.user.email}")
        except Exception as e:
            print('UserConsumer auth failed', str(e))
            await self.close()
            return

        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        print(f"UserConsumer connection accepted for user: {self.user.email}, ID: {self.user.id}")
    async def disconnect(self, close_code):
        print('UserConsumer disconnecting:', self.user.email, self.user_group)
        try:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        except Exception:
            pass
    print('this is after disconnect')
    async def competition_update(self, event):
        # event contains 'competition' dict
        print('Received competition update for user 1111:', self.user.email, event)
        await self.send(text_data=json.dumps(event))
        print('Sent competition update to user:', self.user.email)