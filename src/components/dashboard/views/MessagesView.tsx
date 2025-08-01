'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Bot, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: string;
  timestamp: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  session?: {
    id: string;
    title?: string;
  };
}

export default function MessagesView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'assistant'>('all');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages?limit=50');
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = messages.filter(message => 
    filter === 'all' || message.role === filter
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Messages</h2>
          <p className="text-secondary">View and manage customer conversations</p>
        </div>
        <button onClick={fetchMessages} className="icon-button">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="card-glass p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`button-${filter === 'all' ? 'primary' : 'ghost'} text-sm`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`button-${filter === 'user' ? 'primary' : 'ghost'} text-sm`}
          >
            User Messages
          </button>
          <button
            onClick={() => setFilter('assistant')}
            className={`button-${filter === 'assistant' ? 'primary' : 'ghost'} text-sm`}
          >
            AI Responses
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMessages.map((message) => {
          const isUser = message.role === 'user';
          const timestamp = new Date(message.timestamp);
          
          return (
            <div key={message.id} className="card-glass group hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-start gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                  ${isUser 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }
                `}>
                  {isUser ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {isUser ? (message.user?.name || message.user?.email || 'User') : 'Lithi AI'}
                    </span>
                    {message.session?.title && (
                      <>
                        <span className="text-secondary">•</span>
                        <span className="text-sm text-secondary">{message.session.title}</span>
                      </>
                    )}
                    <span className="text-xs text-secondary flex items-center gap-1 ml-auto">
                      <Clock size={12} />
                      {timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-secondary">No messages found</p>
        </div>
      )}
    </div>
  );
}