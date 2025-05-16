import React, { useState } from "react";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { BrainCircuitIcon, PanelTopIcon } from "lucide-react";

const RightPanel: React.FC = () => {
  const [query, setQuery] = useState("");
  const { sendMessage, isLoading } = useAiAssistant();
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    try {
      const aiResponse = await sendMessage(query);
      setResponse(aiResponse);
      setQuery("");
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
    }
  };

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      {/* AI Assistant widget */}
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="ai-assistant-gradient px-6 py-4">
          <div className="flex items-center">
            <BrainCircuitIcon className="h-8 w-8 text-white" />
            <h3 className="ml-2 text-lg font-semibold text-white">AI Assistant</h3>
          </div>
          <p className="mt-1 text-sm text-white opacity-90">Get context-aware suggestions for your technical issues</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ai-query" className="block text-sm font-medium text-neutral-700 mb-1">Ask a question</label>
              <Textarea
                id="ai-query"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your technical issue..."
                className="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border border-neutral-300 rounded-md"
              />
            </div>
            
            {response && (
              <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                <p className="text-sm text-neutral-700">{response}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary-500 hover:bg-primary-600" 
              disabled={isLoading}
            >
              {isLoading ? "Getting Suggestions..." : "Get AI Suggestions"}
            </Button>
          </form>
        </div>
      </Card>

      {/* Featured image */}
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&h=450" 
          alt="Developers collaborating" 
          className="w-full h-auto"
        />
        <div className="p-4">
          <h3 className="font-medium text-lg text-neutral-900 mb-1">Knowledge Sharing</h3>
          <p className="text-sm text-neutral-600">Share your expertise and learn from others in the developer community.</p>
        </div>
      </Card>

      {/* Trending Issues */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="font-medium text-lg text-neutral-900">Trending Issues</h3>
        </div>
        <div className="p-6">
          <ul className="space-y-4">
            <li>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">How to implement CI/CD pipeline for microservices architecture?</a>
            </li>
            <li>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Troubleshooting memory leaks in Node.js applications</a>
            </li>
            <li>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Best practices for securing API endpoints</a>
            </li>
            <li>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">Migrating from monolith to microservices: lessons learned</a>
            </li>
            <li>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">How to implement effective error boundaries in React?</a>
            </li>
          </ul>
        </div>
      </Card>
    </aside>
  );
};

export default RightPanel;
