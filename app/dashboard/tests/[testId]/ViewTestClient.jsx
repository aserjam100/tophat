"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Play, Save } from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import PreviewWindow from "@/components/PreviewWindow";

export default function ViewTestClient({ user, test }) {
  // Parse all stored data from the database
  let parsedCommands = [];
  let parsedScript = "";
  let parsedMessages = [];
  let parsedConversationHistory = [];
  let parsedExecutionResults = null;

  try {
    // Parse instructions (commands)
    if (test.instructions) {
      const instructionsData =
        typeof test.instructions === "string"
          ? JSON.parse(test.instructions)
          : test.instructions;

      // Handle both old format (direct array) and new format (object with commands)
      if (Array.isArray(instructionsData)) {
        parsedCommands = instructionsData;
      } else if (instructionsData.commands) {
        parsedCommands = instructionsData.commands;
      }

      if (instructionsData.script) {
        parsedScript = instructionsData.script;
      }
    }

    // Parse messages
    if (test.messages) {
      parsedMessages =
        typeof test.messages === "string"
          ? JSON.parse(test.messages)
          : test.messages;
    }

    // Parse conversation history
    if (test.conversation_history) {
      parsedConversationHistory =
        typeof test.conversation_history === "string"
          ? JSON.parse(test.conversation_history)
          : test.conversation_history;
    }

    // Parse execution results if they exist
    if (test.execution_results) {
      parsedExecutionResults =
        typeof test.execution_results === "string"
          ? JSON.parse(test.execution_results)
          : test.execution_results;
    }
  } catch (e) {
    console.error("Error parsing test data:", e);
  }

  // Initialize state with existing test data
  const [testData, setTestData] = useState({
    id: test.id,
    name: test.name || "",
    description: test.description || "",
    script: parsedScript,
    commands: parsedCommands,
    instructions: test.instructions || "",
    status: test.status || "draft",
    messages: parsedMessages,
    isRunning: false,
    executionResults: parsedExecutionResults,
  });

  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState(
    parsedConversationHistory
  );

  const textareaRef = useRef(null);

  // Add initial message showing test is loaded (only if no messages exist)
  useEffect(() => {
    if (testData.messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: "assistant",
        content: `✅ Test "${test.name}" has been loaded. You can modify the test, run it, or ask me questions about it.`,
        timestamp: new Date(),
      };
      addMessage(welcomeMessage);
    }
  }, []);

  // Generate script if we have commands but no script
  useEffect(() => {
    if (testData.commands.length > 0 && !testData.script) {
      generatePuppeteerScript(
        testData.commands,
        testData.name,
        testData.description
      ).then((script) => {
        updateTestData({ script });
      });
    }
  }, []);

  const updateTestData = (updates) => {
    setTestData((prev) => ({ ...prev, ...updates }));
  };

  const addMessage = (message) => {
    setTestData((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const extractCommandsFromResponse = (responseText) => {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        return {
          hasCommands: true,
          testName: jsonData.testName,
          testDescription: jsonData.testDescription,
          commands: jsonData.commands,
        };
      } catch (e) {
        console.error("Failed to parse JSON from response:", e);
        return { hasCommands: false };
      }
    }

    return { hasCommands: false };
  };

  const generatePuppeteerScript = async (
    commands,
    testName,
    testDescription
  ) => {
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commands,
          testName,
          testDescription,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.puppeteerScript;
      } else {
        console.error("Failed to generate script");
        return "// Failed to generate Puppeteer script";
      }
    } catch (error) {
      console.error("Error generating script:", error);
      return "// Error generating Puppeteer script";
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const messageContent = currentMessage.trim();
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const newHistory = [
        ...conversationHistory,
        { role: "user", content: messageContent },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Claude");
      }

      const data = await response.json();
      const assistantContent = data.content;

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      const updatedHistory = [
        ...newHistory,
        { role: "assistant", content: assistantContent },
      ];
      setConversationHistory(updatedHistory);

      const commandData = extractCommandsFromResponse(assistantContent);

      if (commandData.hasCommands) {
        const puppeteerScript = await generatePuppeteerScript(
          commandData.commands,
          commandData.testName,
          commandData.testDescription
        );

        updateTestData({
          name: commandData.testName,
          description: commandData.testDescription,
          script: puppeteerScript,
          commands: commandData.commands,
          executionResults: null,
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      addMessage(errorMessage);

      setIsLoading(false);
    }
  };

  const handleRunTest = async () => {
    if (!testData.commands || testData.commands.length === 0) {
      alert("No test commands to run. Please generate a test first.");
      return;
    }

    updateTestData({ isRunning: true, status: "running" });

    try {
      const response = await fetch("/api/run-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commands: testData.commands,
          testName: testData.name,
          testDescription: testData.description,
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
          timestamp: new Date().toISOString(),
        };

        const newStatus = result.success ? "passed" : "failed";

        updateTestData({
          isRunning: false,
          status: newStatus,
          executionResults: executionResults,
        });

        const resultMessage = {
          id: Date.now(),
          type: "assistant",
          content: result.success
            ? `✅ Test passed successfully! 
            
Execution time: ${result.executionTime}ms
Screenshots: ${result.screenshots?.length || 0} captured

The results have been updated in the Results tab of the Test Preview.`
            : `❌ Test failed: ${result.error || "Unknown error"}
            
Execution time: ${result.executionTime || 0}ms
Screenshots: ${result.screenshots?.length || 0} captured

Check the Results tab for more details including error screenshots.`,
          timestamp: new Date(),
        };
        addMessage(resultMessage);

        // Update existing test with ALL current data
        try {
          const instructionsData = {
            commands: testData.commands,
            script: testData.script,
          };

          const saveResponse = await fetch(`/api/tests/${testData.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: testData.name,
              description: testData.description,
              status: newStatus,
              instructions: JSON.stringify(instructionsData),
              messages: JSON.stringify([...testData.messages, resultMessage]),
              conversation_history: JSON.stringify(conversationHistory),
              execution_results: JSON.stringify(executionResults),
            }),
          });

          if (saveResponse.ok) {
            const saveMessage = {
              id: Date.now() + 1,
              type: "assistant",
              content: `💾 Test results have been automatically saved.`,
              timestamp: new Date(),
            };
            addMessage(saveMessage);
          }
        } catch (saveError) {
          console.error("Error auto-saving test:", saveError);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to run test: ${errorText}`);
      }
    } catch (error) {
      console.error("Error running test:", error);

      const failedExecutionResults = {
        success: false,
        error: error.message,
        executionTime: 0,
        screenshots: [],
        timestamp: new Date().toISOString(),
      };

      updateTestData({
        isRunning: false,
        status: "failed",
        executionResults: failedExecutionResults,
      });

      const errorMessage = {
        id: Date.now(),
        type: "assistant",
        content: `❌ Test execution failed: ${error.message}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    }
  };

  const handleSaveTest = async () => {
    if (
      !testData.name ||
      !testData.commands ||
      testData.commands.length === 0
    ) {
      alert("Please generate a test first before saving.");
      return;
    }

    try {
      const instructionsData = {
        commands: testData.commands,
        script: testData.script,
      };

      const response = await fetch(`/api/tests/${testData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: testData.name,
          description: testData.description,
          instructions: JSON.stringify(instructionsData),
          status: testData.status,
          messages: JSON.stringify(testData.messages),
          conversation_history: JSON.stringify(conversationHistory),
          execution_results: testData.executionResults
            ? JSON.stringify(testData.executionResults)
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update test");
      }

      alert("Test updated successfully!");

      const successMessage = {
        id: Date.now(),
        type: "assistant",
        content: `✅ Test "${testData.name}" has been updated successfully!`,
        timestamp: new Date(),
      };
      addMessage(successMessage);
    } catch (error) {
      console.error("Error updating test:", error);
      alert(`Failed to update test: ${error.message}`);
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
              <div className="text-sm text-stone-600">
                Viewing:{" "}
                <span className="font-medium text-slate-800">{test.name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunTest}
                disabled={
                  !testData.commands ||
                  testData.commands.length === 0 ||
                  testData.isRunning
                }
              >
                <Play size={16} className="mr-2" />
                {testData.isRunning ? "Running..." : "Run Test"}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTest}
                disabled={
                  !testData.name ||
                  !testData.commands ||
                  testData.commands.length === 0
                }
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Save size={16} className="mr-2" />
                Save Changes
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
              Ask me to modify the test or run new commands
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
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                    requestAnimationFrame(() => {
                      textareaRef.current?.focus();
                    });
                  }
                }}
                placeholder="Ask me to modify this test... (Shift+Enter for new line)"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
                disabled={isLoading}
                rows={1}
                style={{ overflowY: "auto" }}
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
              Current script and test details
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
