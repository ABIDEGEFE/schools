from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Accept string IDs (UUIDs or other) for school_id and user_id
    re_path(r'ws/chat/(?P<selected_user_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
]
# /ws/chat/${selectedUserId}/?token=${token}