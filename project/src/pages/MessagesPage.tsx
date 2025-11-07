import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';

interface Message {
  id: string;
  sender: any;
  receiver: any;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
}

export const MessagesPage: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();
  const { selectedUserId } = location.state || {};
  // online presence placeholder (not used yet)

  // console.log('Updated competition state:', state.competition);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);


  // Auto-select conversation if userId is provided in query params
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // load users first (used to map participant meta)
        const users = await api.getAllUsers();
        if (!mounted) return;
        const filtered = users.filter(u => u.id !== state.user?.id);
        setAllUsers(filtered);

        // load existing conversations (threads) and map them into the local Conversation shape
        const convs = await api.getConversations();
        // console.log('fetched conversations', convs);
        if (!mounted) return;
        // Filter only conversations that include current user
        
        const myConvs = convs.filter((c: any) => {
          console.log('conversation participants', c.participants);
          return c.participants && c.participants.some((p: any) => p.id === state.user?.id);
        });

        const mapped: Conversation[] = myConvs.map((c: any) => {
          // pick the other participant as the conversation participant
          const other = c.participants.find((p: any) => p.id !== state.user?.id) || { id: 'unknown', name: 'Unknown' };
          return {
            id: c.id,
            participantId: other.id,
            participantName: other.name || other.email || 'User',
            lastMessage: c.last_message ? {
              id: c.last_message.id,
              sender: c.last_message.sender,
              receiver: c.last_message.receiver,
              content: c.last_message.content,
              timestamp: c.last_message.timestamp,
              read: c.last_message.read,
            } : undefined,
            unreadCount: c.unread_count || 0,
            messages: [], // messages will be loaded on-demand when opening the conv
          };
        });

        setConversations(mapped);
        console.log('selected user id', selectedUserId)
        // auto-select from query param if present (only after conversations/users loaded)
        if (selectedUserId) {
          const found = mapped.find(c => c.participantId === selectedUserId);
          if (found) {
            console.log('found works', found)
            setSelectedConversation(found.id);
          } else {
            // fetch history for that user and pass the freshly loaded users
            console.log('found not work')
            handleSelectUser(selectedUserId, filtered);
          }
        }
      } catch (err) {
        console.error('Failed to load users or conversations', err);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log('1')
    if (!newMessage.trim() || !currentConversation) return;
    // console.log('2')
    const recipientId = currentConversation.participantId;
    const payload = JSON.stringify({ recipientId, message: newMessage });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
    setNewMessage('');
  };
  
  const handleSelectUser = async (userId: string, usersParam?: any[]) => {
    // fetch history
    try {
      const currentUserId = state.user?.id;
      if (!currentUserId) {
        console.log('current user id is not available.')
        console.warn('No current user id available, cannot fetch history');
        return;
      }
      console.log('loading message history with userId', userId);
      const msgs = await api.getMessageHistory(userId, currentUserId);
      const convId = `conv_${userId}`;
      const usersList = usersParam ?? allUsers;
      const participant = usersList.find((u: any) => u.id === userId) || { id: userId, name: 'Unknown' };
      console.log('selected participant', participant);
      console.log('all users list', allUsers.length);
      const conv: Conversation = {
        id: convId,
        participantId: userId,
        participantName: participant.name || participant.email || 'User',
        lastMessage: msgs.length ? msgs[msgs.length - 1] : undefined,
        unreadCount: 0,
        messages: msgs,
      };
      // replace or append
      setConversations(prev => {
        const others = prev.filter(p => p.participantId !== userId);
        return [conv, ...others];
      });
      setSelectedConversation(convId);

    // Open WebSocket connection for real-time messages (include token in query string)
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No access token found in sessionStorage; cannot open WebSocket');
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${proto}://${window.location.hostname}:8000/ws/chat/${userId}/?token=${encodeURIComponent(token)}`;
      if (wsRef.current) {
        wsRef.current.close();
      }
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('WebSocket opened');
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          console.log('WS message received', data);
          // Only handle chat_message type
          if (data.type === 'chat_message') {
            const incoming: Message = {
              id: data.id,
              sender: { id: data.senderId },
              receiver: { id: data.receiverId },
              content: data.message,
              timestamp: data.timestamp,
              read: false,
            };
            // append to conversation
            setConversations(prev => prev.map(c => {
              if (c.participantId === userId) {
                return { ...c, messages: [...c.messages, incoming], lastMessage: incoming };
              }
              return c;
            }));
          }
        } catch (err) {
          console.error('WS message parse error', err);
          console.log('Raw message error:', ev.data);
        }
      };
      ws.onclose = () => console.log('WebSocket closed');
      ws.onerror = (err) => console.error('WS error', err);
      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations && conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectUser(conversation.participantId)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{conversation.participantName}</h3>
                {/* {conversation.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {conversation.unreadCount}
                  </span>
                )} */}
              </div>
              <p className="text-sm text-gray-600 truncate">{conversation.lastMessage?.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {conversation.lastMessage?.timestamp && formatTime(conversation.lastMessage.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                {state.user?.profilePicture ? (
                  <img
                    src={state.user.profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <UserIcon className="h-6 w-6 text-gray-600" />
                )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentConversation.participantName}</h3>
                  <p className="text-sm text-gray-600"><span className="font-medium text-green-400">Online</span></p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentConversation.messages.map((message) => {
                const isCurrentUser = (message as any).sender?.id === state.user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Send</span>
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};