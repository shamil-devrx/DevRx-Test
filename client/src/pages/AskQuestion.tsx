import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuestionForm from "@/components/QuestionForm";

const AskQuestion: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Sign In Required</h1>
          <p className="mb-6 text-neutral-600">
            You need to be signed in to ask a question. Please sign in to continue.
          </p>
          <Button
            onClick={() => { window.location.href = "/api/login"; }}
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Ask a Question</h1>
        <p className="text-neutral-600">
          Get help from the community by clearly describing your technical problem
        </p>
      </div>

      <QuestionForm />
    </div>
  );
};

export default AskQuestion;
