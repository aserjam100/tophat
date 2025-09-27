'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Play, Save } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import PreviewWindow from '@/components/PreviewWindow';

export default function NewTestClient({ user }) {
  // Shared state between chat and preview
  const [testData, setTestData] = useState({
    name: '',
    description: '',
    script: '',
    status: 'draft',
    messages: [],
    isRunning: false
  });

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to update test data (shared between components)
  const updateTestData = (updates) => {
    setTestData(prev => ({ ...prev, ...updates }));
  };

  // Function to add a message to the chat
  const addMessage = (message) => {
    setTestData(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  // Handle sending message to Claude (placeholder)
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // TODO: Implement Claude API integration here
      // For now, just add a placeholder response
      setTimeout(() => {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'I\'ll help you create that Puppeteer test. Let me generate the script for you...',
          timestamp: new Date()
        };
        addMessage(assistantMessage);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  // Handle running the test (placeholder)
  const handleRunTest = async () => {
    if (!testData.script) return;
    
    updateTestData({ isRunning: true });
    
    try {
      // TODO: Implement test execution
      setTimeout(() => {
        updateTestData({ 
          isRunning: false,
          status: 'passed' // or 'failed' based on results
        });
      }, 3000);
    } catch (error) {
      console.error('Error running test:', error);
      updateTestData({ isRunning: false, status: 'failed' });
    }
  };

  // Handle saving the test (placeholder)
  const handleSaveTest = async () => {
    if (!testData.name || !testData.script) return;
    
    try {
      // TODO: Implement saving to Supabase
      console.log('Saving test:', testData);
      alert('Test saved successfully!');
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test');
    }
  };

  return (
    <div className="h-screen bg-stone-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunTest}
                disabled={!testData.script || testData.isRunning}
              >
                <Play size={16} className="mr-2" />
                {testData.isRunning ? 'Running...' : 'Run Test'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTest}
                disabled={!testData.name || !testData.script}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Save size={16} className="mr-2" />
                Save Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Chat Window - Left Side */}
        <div className="w-1/2 border-r border-stone-200 bg-white flex flex-col min-h-0">
          <div className="p-4 border-b border-stone-200 flex-shrink-0">
            <h2 className="text-lg font-medium text-slate-800">Mad Hatter</h2>
            <p className="text-sm text-stone-600">
              Describe what you want to test and I'll help you build it
            </p>
          </div>
          
          {/* ChatWindow takes up remaining space */}
          <div className="flex-1 min-h-0">
            <ChatWindow 
              messages={testData.messages}
              isLoading={isLoading}
              testData={testData}
              updateTestData={updateTestData}
            />
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-stone-200 flex-shrink-0">
            <div className="flex space-x-2">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe the test you want to create... (Shift+Enter for new line)"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
                disabled={isLoading}
                rows={1}
                style={{ overflowY: 'auto' }}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Window - Right Side */}
        <div className="w-1/2 bg-stone-50 flex flex-col min-h-0">
          <div className="p-4 bg-white border-b border-stone-200 flex-shrink-0">
            <h2 className="text-lg font-medium text-slate-800">Test Preview</h2>
            <p className="text-sm text-stone-600">
              Generated script and test details
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <PreviewWindow 
              testData={testData}
              updateTestData={updateTestData}
              onRunTest={handleRunTest}
              onSaveTest={handleSaveTest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}