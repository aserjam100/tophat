'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code2, FileText, Settings, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function PreviewWindow({ testData, updateTestData, onRunTest, onSaveTest }) {
  const [activeTab, setActiveTab] = useState('details');

  // Handle input changes
  const handleInputChange = (field, value) => {
    updateTestData({ [field]: value });
  };

  // Status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'passed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'running':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', animate: true };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      default:
        return { icon: FileText, color: 'text-stone-600', bg: 'bg-stone-50' };
    }
  };

  const statusDisplay = getStatusDisplay(testData.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-stone-600 hover:text-slate-800'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'script'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-stone-600 hover:text-slate-800'
            }`}
          >
            <Code2 size={16} className="inline mr-2" />
            Script
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-stone-600 hover:text-slate-800'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' && (
          <div className="p-4 space-y-6">
            {/* Status Display */}
            {testData.status && (
              <div className={`p-3 rounded-lg ${statusDisplay.bg}`}>
                <div className="flex items-center gap-2">
                  <StatusIcon 
                    size={20} 
                    className={`${statusDisplay.color} ${statusDisplay.animate ? 'animate-spin' : ''}`} 
                  />
                  <span className={`font-medium ${statusDisplay.color}`}>
                    {testData.status.charAt(0).toUpperCase() + testData.status.slice(1)}
                  </span>
                  {testData.isRunning && (
                    <span className="text-sm text-stone-600">Test is running...</span>
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
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this test does..."
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
            </div>

            
          </div>
        )}

        {activeTab === 'script' && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Generated Puppeteer Script
              </label>
              {testData.script ? (
                <textarea
                  value={testData.script}
                  onChange={(e) => handleInputChange('script', e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder="// Puppeteer script will appear here..."
                />
              ) : (
                <div className="h-96 border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center">
                  <div className="text-center text-stone-500">
                    <Code2 size={48} className="mx-auto mb-4 text-stone-400" />
                    <p className="text-lg mb-2">No script generated yet</p>
                    <p className="text-sm">
                      Start chatting to generate your Puppeteer test script
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Test Settings</h3>
              
              {/* Timeout Setting */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={testData.timeout || 30}
                  onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
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
                    onChange={(e) => handleInputChange('headless', e.target.checked)}
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
                    onChange={(e) => handleInputChange('screenshotOnFailure', e.target.checked)}
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