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
    commands: [],
    status: 'draft',
    messages: [],
    isRunning: false,
    executionResults: null
  });

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Store conversation history for Claude API
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const textareaRef = useRef(null);

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

  // Extract JSON commands from Claude's response
  const extractCommandsFromResponse = (responseText) => {
    // Look for JSON code block in the response
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        return {
          hasCommands: true,
          testName: jsonData.testName,
          testDescription: jsonData.testDescription,
          commands: jsonData.commands
        };
      } catch (e) {
        console.error('Failed to parse JSON from response:', e);
        return { hasCommands: false };
      }
    }
    
    return { hasCommands: false };
  };

  // Generate actual Puppeteer script from commands
  const generatePuppeteerScript = async (commands, testName, testDescription) => {
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands,
          testName,
          testDescription
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.puppeteerScript;
      } else {
        console.error('Failed to generate script');
        return '// Failed to generate Puppeteer script';
      }
    } catch (error) {
      console.error('Error generating script:', error);
      return '// Error generating Puppeteer script';
    }
  };

  // Handle sending message to Claude
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    const messageContent = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Add user message to conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: messageContent }
      ];

      // Call Claude API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Claude');
      }

      const data = await response.json();
      const assistantContent = data.content;

      // Add assistant message to chat
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };
      addMessage(assistantMessage);

      // Update conversation history
      const updatedHistory = [
        ...newHistory,
        { role: 'assistant', content: assistantContent }
      ];
      setConversationHistory(updatedHistory);

      // Check if response contains commands
      const commandData = extractCommandsFromResponse(assistantContent);
      
      if (commandData.hasCommands) {
        // Generate Puppeteer script from commands
        const puppeteerScript = await generatePuppeteerScript(
          commandData.commands,
          commandData.testName,
          commandData.testDescription
        );

        // Update test data with generated content
        updateTestData({
          name: commandData.testName,
          description: commandData.testDescription,
          script: puppeteerScript,
          commands: commandData.commands,
          executionResults: null
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      addMessage(errorMessage);
      
      setIsLoading(false);
    }
  };

  // Handle running the test
  const handleRunTest = async () => {
    if (!testData.commands || testData.commands.length === 0) {
      alert('No test commands to run. Please generate a test first.');
      return;
    }
    
    updateTestData({ isRunning: true, status: 'running' });
    
    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: testData.commands,
          testName: testData.name,
          testDescription: testData.description
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const executionResults = {
          success: result.success,
          error: result.error,
          executionTime: result.executionTime,
          screenshots: result.screenshots || [],
          puppeteerScript: result.puppeteerScript,
          timestamp: new Date().toISOString()
        };
        
        updateTestData({ 
          isRunning: false,
          status: result.success ? 'passed' : 'failed',
          executionResults: executionResults
        });
        
        const resultMessage = {
          id: Date.now(),
          type: 'assistant',
          content: result.success 
            ? `✅ Test passed successfully! 
            
Execution time: ${result.executionTime}ms
Screenshots: ${result.screenshots?.length || 0} captured

The results have been updated in the Results tab of the Test Preview.` 
            : `❌ Test failed: ${result.error || 'Unknown error'}
            
Execution time: ${result.executionTime || 0}ms
Screenshots: ${result.screenshots?.length || 0} captured

Check the Results tab for more details including error screenshots.`,
          timestamp: new Date(),
          screenshots: result.screenshots
        };
        addMessage(resultMessage);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to run test: ${errorText}`);
      }
    } catch (error) {
      console.error('Error running test:', error);
      
      const failedExecutionResults = {
        success: false,
        error: error.message,
        executionTime: 0,
        screenshots: [],
        timestamp: new Date().toISOString()
      };
      
      updateTestData({ 
        isRunning: false, 
        status: 'failed',
        executionResults: failedExecutionResults
      });
      
      const errorMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `❌ Test execution failed: ${error.message}`,
        timestamp: new Date()
      };
      addMessage(errorMessage);
    }
  };

  // Handle saving the test
  const handleSaveTest = async () => {
    if (!testData.name || !testData.commands || testData.commands.length === 0) {
      alert('Please generate a test first before saving.');
      return;
    }
    
    try {
      const testToSave = {
        name: testData.name,
        description: testData.description,
        commands: testData.commands,
        script: testData.script,
        executionResults: testData.executionResults,
        createdBy: user?.id,
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving test:', testToSave);
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
                disabled={!testData.commands || testData.commands.length === 0 || testData.isRunning}
              >
                <Play size={16} className="mr-2" />
                {testData.isRunning ? 'Running...' : 'Run Test'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTest}
                disabled={!testData.name || !testData.commands || testData.commands.length === 0}
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
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                    requestAnimationFrame(() => {
                      textareaRef.current?.focus();
                    });
                  }
                }}
                placeholder="Describe the test you want to create... (Shift+Enter for new line)"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
                disabled={isLoading}
                rows={1}
                style={{ overflowY: 'auto' }}
                autoFocus
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