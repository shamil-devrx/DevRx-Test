import React, { useState, useRef, useEffect } from "react";
import { XIcon, SendIcon, BrainCircuitIcon, AlertCircleIcon } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("");
  const { messages, sendMessage, isLoading, clearConversation, isAiAvailable } = useAiAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clear conversation when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearConversation();
    }
  }, [isOpen, clearConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    try {
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-500 bg-opacity-75 z-30 overflow-y-auto" aria-labelledby="chat-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="ai-assistant-gradient px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BrainCircuitIcon className="h-6 w-6 text-white" />
                <h3 className="ml-2 text-lg font-semibold text-white" id="chat-modal-title">AI Assistant</h3>
              </div>
              <button 
                type="button" 
                className="text-white hover:text-neutral-200 focus:outline-none"
                onClick={onClose}
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="bg-neutral-50 h-96 overflow-y-auto p-4 space-y-4">
            {!isAiAvailable && (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  AI features are currently disabled. Add an OpenAI API key to enable the assistant.
                </AlertDescription>
              </Alert>
            )}
            
            {messages.length === 0 ? (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white">
                    <BrainCircuitIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-3 bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-sm text-neutral-800">
                    Hello! I'm DevRx Assistant. How can I help you today? You can ask me about technical issues, development best practices, or specific error messages you're encountering.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="flex items-start">
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white">
                          <BrainCircuitIcon className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="ml-3 bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-neutral-800">{msg.content}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 ml-auto order-2">
                        <UserAvatar user={user as any} className="h-10 w-10 rounded-full" />
                      </div>
                      <div className="mr-3 bg-primary-100 p-3 rounded-lg shadow-sm order-1 ml-auto">
                        <p className="text-sm text-neutral-800">{msg.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white">
                    <BrainCircuitIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-3 bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-sm text-neutral-800">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="bg-white px-4 py-3 border-t border-neutral-200">
            <form onSubmit={handleSubmit} className="flex items-center">
              <Input
                type="text"
                className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Type your question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="ml-2 inline-flex items-center justify-center p-2 rounded-full text-primary-500 hover:bg-primary-100"
              >
                <SendIcon className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
