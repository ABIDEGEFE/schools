import json
import uuid
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from core.models import Message, Conversation
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings


User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            print('ChatConsumer: anonymous user, closing connection')
            await self.close()
            return
        self.user = user
        print('ChatConsumer connecting for user:', self.user.email, self.user.id)
        try:
            self.selected_user_id = self.scope['url_route']['kwargs'].get('selected_user_id')
        except Exception:
            await self.close()
            return

        # build a deterministic group name for the chat between two user ids
        try:
            user_id = self.user.id
            a, b = (max(user_id, self.selected_user_id), min(user_id, self.selected_user_id))
            self.user_group_name = f'chat_{a}_{b}'
        except Exception:
            await self.close()
            return

        # Join chat group
        try:
            await self.channel_layer.group_add(self.user_group_name, self.channel_name)
            print('ChatConsumer: joined group', self.user_group_name)
        except Exception as e:
            print('ChatConsumer: failed to join group', str(e))
        print('this is before accepttttttttt')
        try:
            await self.accept()
            print('ChatConsumer: accepted connection')
        except Exception as e:
            print('ChatConsumer: accept failed', str(e))
            await self.close()
            return
        try:
            print(f"WebSockettttttttt connection accepted for user: {self.user.email}, ID: {self.user.id}")
        except Exception:
            pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        print('message for now', message)
        recipient_id = data.get('recipientId') or data.get('recipient_id')
        recipient_obj = await self.get_target_user(recipient_id)
        try:
            sender_info = f"{self.user.email} ({self.user.id})"
        except Exception:
            sender_info = str(self.user)
        print(f"Received message from {sender_info} to {recipient_obj}: {message}")
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
        # create the message
        msg = Message.objects.create(
            id=str(uuid.uuid4()),
            sender=sender,
            receiver=receiver,
            content=content
        )

        # try to find an existing conversation containing both participants
        conv = None
        try:
            if sender and receiver:
                conv = Conversation.objects.filter(participants=sender).filter(participants=receiver).first()
        except Exception:
            conv = None

        # create a conversation if none exists
        if not conv:
            try:
                conv = Conversation.objects.create(id=str(uuid.uuid4()))
                if sender:
                    conv.participants.add(sender)
                if receiver:
                    conv.participants.add(receiver)
            except Exception as e:
                print('Failed to create conversation:', str(e))
                conv = None

        # attach message to conversation and update metadata
        if conv:
            try:
                msg.conversation = conv
                msg.save()
                conv.last_message = msg
                try:
                    # increment unread_count for receiver
                    conv.unread_count = (conv.unread_count or 0) + (1 if sender and receiver and sender.id != receiver.id else 0)
                except Exception:
                    conv.unread_count = 0
                conv.save()
            except Exception as e:
                print('Failed to attach message to conversation:', str(e))

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
        # Authenticate the connection using access token from query string
        print("session based", self.scope["session"])
        user = self.scope['user']
        if user.is_anonymous:
            print('AnnouncementConsumer: anonymous user, closing connection')
            await self.close()
            return
        self.user = user
        print('AnnouncementConsumer connecting for user:', self.user.email, self.user.id)
        await self.accept()
        # Join global announcements group
        self.group_name = 'announcements'
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Also join a school-specific announcements group if the user belongs to a school
        self.school_group = None
        try:
            school_id = getattr(self.user, 'school_id', None)
            if school_id:
                print(f"Joining school-specific announcements group for school ID: {school_id}")
                self.school_group = f'announcements_school_{school_id}'
                await self.channel_layer.group_add(self.school_group, self.channel_name)
        except Exception:
            self.school_group = None

    async def disconnect(self, close_code):
        # Leave global announcements group
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass
        # Leave school-specific group if present
        if getattr(self, 'school_group', None):
            try:
                await self.channel_layer.group_discard(self.school_group, self.channel_name)
            except Exception:
                pass
   
    async def receive(self, text_data):
        data = json.loads(text_data)
        announcement = data.get('announcement', '')
        if not announcement:
            return

        payload = {
            'type': 'announcement_message',
            'announcement': announcement,
            'timestamp': str(uuid.uuid4()),  # Placeholder timestamp
        }

    async def announcement_message(self, event):
        # Forward the event payload to WebSocket client
        await self.send(text_data=json.dumps(event))
        


class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            print('UserConsumer: anonymous user, closing connection')
            await self.close()
            return
        self.user = user
        print('UserConsumer connecting for user:', self.user.email, self.user.id)

        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
       
    async def disconnect(self, close_code):
        # print('UserConsumer disconnecting:', user.email, self.user_group)
        try:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        except Exception:
            pass
   
    async def competition_update(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_target_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
