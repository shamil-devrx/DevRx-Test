import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon, KeyIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAiAvailability } from "@/hooks/useAiAvailability";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAiAvailable, isLoading } = useAiAvailability();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/settings/openai-key", {
        apiKey: apiKey.trim()
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "OpenAI API key has been saved. AI features are now enabled.",
        });
        
        // Invalidate the AI status query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["/api/ai/status"] });
        
        // Clear the form
        setApiKey("");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save API key");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5" />
            <span>AI Features</span>
          </CardTitle>
          <CardDescription>
            Configure the OpenAI API key to enable AI-powered features in DevRx
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4">Loading AI status...</div>
          ) : (
            <>
              {isAiAvailable ? (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">AI Features Enabled</AlertTitle>
                  <AlertDescription className="text-green-700">
                    AI-powered features are active and working. You can update your API key below if needed.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">AI Features Disabled</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    AI features are currently disabled. Add your OpenAI API key below to enable AI-powered suggestions, 
                    tag recommendations, and the AI assistant.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenAI API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-neutral-500">
                    Your API key is stored securely and used only for DevRx AI features.
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">OpenAI's platform</a>.
                  </p>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save API Key"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;