'use client';

import { useEffect, useRef } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';

export default function ChatWindow({ messages, isLoading, testData, updateTestData }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-hidden">
      {/* Messages Container */}
      <div className="h-full overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-500">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 text-stone-400" />
              <p className="text-lg mb-2">Ready to help you create tests</p>
              <p className="text-sm">
                Start by describing what you want to test, like:
                <br />
                "Test login functionality on my website"
                <br />
                "Check if the contact form works"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-slate-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-slate-800 text-white'
                      : 'bg-stone-100 text-slate-800'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-2 opacity-70 ${
                      message.type === 'user' ? 'text-slate-300' : 'text-stone-600'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-slate-600" />
                </div>
                <div className="bg-stone-100 text-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}