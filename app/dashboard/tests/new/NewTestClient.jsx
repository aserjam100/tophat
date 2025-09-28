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
    commands: [], // Add commands array to state
    status: 'draft',
    messages: [],
    isRunning: false,
    executionResults: null // Add execution results to state
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

  // Generate commands based on user input
  const generateCommands = (userInput) => {
    // For now, generate hardcoded commands for login test
    // Later this will be replaced by LLM API call
    const commands = [
      { 
        action: "navigate", 
        url: "http://localhost:3000/login",
        description: "Navigate to login page"
      },
      { 
        action: "waitForSelector", 
        selector: "#email",
        description: "Wait for email field to appear"
      },
      { 
        action: "type", 
        selector: "#email", 
        text: "ozzy.main.official@gmail.com",
        description: "Enter email"
      },
      { 
        action: "waitForSelector", 
        selector: "#password",
        description: "Wait for password field to appear"
      },
      { 
        action: "type", 
        selector: "#password", 
        text: "slipknot87",
        description: "Enter password"
      },
      { 
        action: "click", 
        selector: 'button[type="submit"]',
        description: "Click login button"
      },
      { 
        action: "waitForNavigation", 
        description: "Wait for page to load after login"
      },
      { 
        action: "waitForText", 
        text: "Dashboard",
        description: "Verify successful login by checking dashboard page"
      },
      { 
        action: "screenshot", 
        filename: `login-test-success-${Date.now()}.png`,
        description: "Take screenshot of successful login"
      }
    ];

    return commands;
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
      // Generate commands based on user input
      const commands = generateCommands(currentMessage.trim());
      
      // Generate test name and description
      const testName = "Login Functionality Test";
      const testDescription = "Automated test to verify user login functionality with valid credentials";
      
      // Generate actual Puppeteer script
      const puppeteerScript = await generatePuppeteerScript(commands, testName, testDescription);

      // Simulate processing delay
      setTimeout(() => {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `I've generated a login test for you! This test will:

1. Navigate to http://localhost:3000/login
2. Enter the email: ozzy.main.official@gmail.com
3. Enter the password: slipknot87
4. Click the login button
5. Verify successful login

The test commands have been generated and converted to a Puppeteer script. You can see the details in the Test Preview panel.`,
          timestamp: new Date()
        };

        addMessage(assistantMessage);
        
        // Update test data with generated content
        updateTestData({
          name: testName,
          description: testDescription,
          script: puppeteerScript,
          commands: commands,
          executionResults: null // Reset execution results when generating new test
        });
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
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
      // Send commands to backend
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
        
        // Store the complete execution results
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
        
        // Add result message to chat
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
          screenshots: result.screenshots // Add screenshots to the message for chat display
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

  // Handle saving the test (placeholder)
  const handleSaveTest = async () => {
    if (!testData.name || !testData.commands || testData.commands.length === 0) {
      alert('Please generate a test first before saving.');
      return;
    }
    
    try {
      // TODO: Implement saving to Supabase
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