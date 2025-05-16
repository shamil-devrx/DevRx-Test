import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuitIcon } from "lucide-react";

interface AiSuggestionProps {
  content: string;
  className?: string;
}

const AiSuggestion: React.FC<AiSuggestionProps> = ({ content, className }) => {
  if (!content) return null;
  
  return (
    <div className={`bg-neutral-50 px-6 py-4 border-t border-neutral-200 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary-500 text-white">
            <BrainCircuitIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-500">AI Assistant Suggestion</p>
          <p className="mt-1 text-sm text-neutral-700">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default AiSuggestion;
