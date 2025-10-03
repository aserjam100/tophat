"use client";

import { useEffect, useRef } from "react";
import { Bot, User, Loader2, Image as ImageIcon } from "lucide-react";

export default function ChatWindow({
  messages,
  isLoading,
  testData,
  updateTestData,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Messages Container - Fixed height with scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-w-full">
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
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-slate-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] min-w-0 rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-stone-100 text-slate-800"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words word-break-break-word overflow-hidden">
                    {message.content}
                  </div>

                  {/* Render screenshots if present in message */}
                  {message.screenshots && message.screenshots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-stone-600">
                        <ImageIcon size={14} />
                        <span>Screenshots ({message.screenshots.length})</span>
                      </div>
                      <div className="space-y-2">
                        {message.screenshots.map((screenshot, idx) => {
                          // Handle both string and object formats
                          const screenshotData =
                            typeof screenshot === "string"
                              ? {
                                  filename: screenshot,
                                  data: `/screenshots/${screenshot}`,
                                }
                              : screenshot;

                          return (
                            <div
                              key={idx}
                              className="border border-stone-300 rounded overflow-hidden"
                            >
                              <img
                                src={screenshotData.data || screenshotData.url}
                                alt={
                                  screenshotData.filename ||
                                  `Screenshot ${idx + 1}`
                                }
                                className="w-full h-auto max-h-48 object-contain bg-white"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const errorDiv =
                                    document.createElement("div");
                                  errorDiv.className =
                                    "flex items-center justify-center h-24 bg-stone-50 text-stone-500 text-xs";
                                  errorDiv.textContent =
                                    "Screenshot unavailable";
                                  e.target.parentElement.appendChild(errorDiv);
                                }}
                              />
                              {screenshotData.filename && (
                                <div className="px-2 py-1 bg-white text-xs text-stone-600 flex items-center justify-between">
                                  <span className="truncate">
                                    {screenshotData.filename}
                                  </span>
                                  {screenshotData.type === "failure" && (
                                    <span className="ml-2 text-red-600 font-medium">
                                      Failed
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-xs mt-2 opacity-70 ${
                      message.type === "user"
                        ? "text-slate-300"
                        : "text-stone-600"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.type === "user" && (
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
