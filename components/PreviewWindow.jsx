"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Code2,
  FileText,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  List,
  BarChart3,
  Image,
  Timer,
} from "lucide-react";

export default function PreviewWindow({
  testData,
  updateTestData,
  onRunTest,
  onSaveTest,
}) {
  const [activeTab, setActiveTab] = useState("details");

  // Handle input changes
  const handleInputChange = (field, value) => {
    updateTestData({ [field]: value });
  };

  // Status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case "passed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "failed":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-50" };
      case "running":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bg: "bg-blue-50",
          animate: true,
        };
      case "pending":
        return { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" };
      default:
        return { icon: FileText, color: "text-stone-600", bg: "bg-stone-50" };
    }
  };

  const statusDisplay = getStatusDisplay(testData.status);
  const StatusIcon = statusDisplay.icon;

  // Format execution time
  const formatExecutionTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-stone-600 hover:text-slate-800"
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab("commands")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "commands"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-stone-600 hover:text-slate-800"
            }`}
          >
            <List size={16} className="inline mr-2" />
            Commands
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "script"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-stone-600 hover:text-slate-800"
            }`}
          >
            <Code2 size={16} className="inline mr-2" />
            Script
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-stone-600 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={16} className="inline mr-2" />
            Results
            {(testData.executionResults || testData.screenshots) && (
              <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-stone-600 hover:text-slate-800"
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "details" && (
          <div className="p-4 space-y-6">
            {/* Status Display */}
            {testData.status && (
              <div className={`p-3 rounded-lg ${statusDisplay.bg}`}>
                <div className="flex items-center gap-2">
                  <StatusIcon
                    size={20}
                    className={`${statusDisplay.color} ${
                      statusDisplay.animate ? "animate-spin" : ""
                    }`}
                  />
                  <span className={`font-medium ${statusDisplay.color}`}>
                    {testData.status.charAt(0).toUpperCase() +
                      testData.status.slice(1)}
                  </span>
                  {testData.isRunning && (
                    <span className="text-sm text-stone-600">
                      Test is running...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Test Name */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Test Name
              </label>
              <input
                type="text"
                value={testData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter test name..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            {/* Test Description */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Description
              </label>
              <textarea
                value={testData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this test does..."
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Commands Summary */}
            {testData.commands && testData.commands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Test Steps
                </label>
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-sm text-stone-600 mb-2">
                    {testData.commands.length} commands generated
                  </p>
                  <div className="space-y-1">
                    {testData.commands.slice(0, 3).map((command, index) => (
                      <div key={index} className="text-sm text-stone-700">
                        {index + 1}. {command.description}
                      </div>
                    ))}
                    {testData.commands.length > 3 && (
                      <div className="text-sm text-stone-500">
                        ... and {testData.commands.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "commands" && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Test Commands
              </label>
              {testData.commands && testData.commands.length > 0 ? (
                <div className="space-y-3">
                  {testData.commands.map((command, index) => (
                    <div key={index} className="border border-stone-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-slate-800">
                          {command.action}
                        </span>
                      </div>
                      
                      <div className="text-sm text-stone-600 mb-2">
                        {command.description}
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        {command.url && (
                          <div>
                            <span className="font-medium">URL:</span> {command.url}
                          </div>
                        )}
                        {command.selector && (
                          <div>
                            <span className="font-medium">Selector:</span>{" "}
                            <code className="bg-stone-100 px-1 rounded">
                              {command.selector}
                            </code>
                          </div>
                        )}
                        {command.text && (
                          <div>
                            <span className="font-medium">Text:</span> {command.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center">
                  <div className="text-center text-stone-500">
                    <List size={48} className="mx-auto mb-4 text-stone-400" />
                    <p className="text-lg mb-2">No commands generated yet</p>
                    <p className="text-sm">
                      Start chatting to generate your test commands
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "script" && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Generated Script Preview
              </label>
              {testData.script ? (
                <textarea
                  value={testData.script}
                  onChange={(e) => handleInputChange("script", e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder="// Script preview will appear here..."
                />
              ) : (
                <div className="h-96 border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center">
                  <div className="text-center text-stone-500">
                    <Code2 size={48} className="mx-auto mb-4 text-stone-400" />
                    <p className="text-lg mb-2">No script generated yet</p>
                    <p className="text-sm">
                      Start chatting to generate your test script
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Test Execution Results
                </label>
                
                {/* Show results if test has been executed */}
                {testData.executionResults ? (
                  <div className="space-y-4">
                    {/* Status Summary */}
                    <div className={`p-4 rounded-lg ${statusDisplay.bg}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon
                            size={24}
                            className={`${statusDisplay.color} ${
                              statusDisplay.animate ? "animate-spin" : ""
                            }`}
                          />
                          <div>
                            <h3 className={`font-semibold ${statusDisplay.color}`}>
                              Test {testData.status?.charAt(0).toUpperCase() + testData.status?.slice(1)}
                            </h3>
                            {testData.executionResults.executionTime && (
                              <div className="flex items-center gap-1 text-sm text-stone-600">
                                <Timer size={14} />
                                Execution time: {formatExecutionTime(testData.executionResults.executionTime)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Error message if failed */}
                      {testData.status === 'failed' && testData.executionResults.error && (
                        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                          <strong>Error:</strong> {testData.executionResults.error}
                        </div>
                      )}
                    </div>

                    {/* Screenshots Section - FIXED */}
                    {testData.executionResults.screenshots && testData.executionResults.screenshots.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                          <Image size={18} />
                          Screenshots ({testData.executionResults.screenshots.length})
                        </h4>
                        <div className="grid gap-4">
                          {testData.executionResults.screenshots.map((screenshot, index) => {
                            // Handle both string format (old) and object format (new)
                            const screenshotData = typeof screenshot === 'string' 
                              ? { filename: screenshot, data: `/screenshots/${screenshot}`, type: 'success' }
                              : screenshot;
                            
                            return (
                              <div key={index} className="border border-stone-200 rounded-lg overflow-hidden bg-white">
                                <div className="p-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                                  <p className="text-sm font-medium text-stone-700">
                                    {screenshotData.filename}
                                  </p>
                                  {screenshotData.type === 'failure' && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                      Failure
                                    </span>
                                  )}
                                </div>
                                <div className="p-2">
                                  <img 
                                    src={screenshotData.data || screenshotData.url || `/screenshots/${screenshotData.filename}`}
                                    alt={`Test screenshot ${index + 1}`}
                                    className="w-full h-auto max-h-96 object-contain bg-gray-50 rounded"
                                    onError={(e) => {
                                      e.target.parentElement.innerHTML = `
                                        <div class="flex items-center justify-center h-32 bg-stone-100 text-stone-500 rounded">
                                          <div class="text-center">
                                            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                            </svg>
                                            <p class="text-sm">Screenshot not available</p>
                                          </div>
                                        </div>
                                      `;
                                    }}
                                  />
                                </div>
                                {screenshotData.takenAt && (
                                  <div className="px-2 pb-2 text-xs text-stone-500">
                                    Captured at: {new Date(screenshotData.takenAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Test Log (if available) */}
                    {testData.executionResults.logs && (
                      <div>
                        <h4 className="font-medium text-slate-800 mb-3">
                          Execution Log
                        </h4>
                        <div className="bg-stone-900 text-stone-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{testData.executionResults.logs}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No results yet */
                  <div className="h-64 border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center">
                    <div className="text-center text-stone-500">
                      <BarChart3 size={48} className="mx-auto mb-4 text-stone-400" />
                      <p className="text-lg mb-2">No results yet</p>
                      <p className="text-sm mb-4">
                        Run your test to see execution results and screenshots
                      </p>
                      <Button 
                        onClick={onRunTest}
                        disabled={!testData.commands || testData.commands.length === 0 || testData.isRunning}
                        size="sm"
                      >
                        <Play size={16} className="mr-2" />
                        {testData.isRunning ? 'Running...' : 'Run Test'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">
                Test Settings
              </h3>

              {/* Timeout Setting */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={testData.timeout || 30}
                  onChange={(e) =>
                    handleInputChange("timeout", parseInt(e.target.value))
                  }
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>

              {/* Headless Mode */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={testData.headless !== false}
                    onChange={(e) =>
                      handleInputChange("headless", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Run in headless mode
                  </span>
                </label>
                <p className="text-xs text-stone-600 mt-1">
                  Runs browser without UI for faster execution
                </p>
              </div>

              {/* Screenshot on Failure */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={testData.screenshotOnFailure !== false}
                    onChange={(e) =>
                      handleInputChange("screenshotOnFailure", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Take screenshot on failure
                  </span>
                </label>
                <p className="text-xs text-stone-600 mt-1">
                  Automatically capture screenshot when test fails
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}