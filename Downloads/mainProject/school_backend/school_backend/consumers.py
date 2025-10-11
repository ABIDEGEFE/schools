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