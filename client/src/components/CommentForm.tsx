import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CommentFormProps {
  questionId?: number;
  answerId?: number;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  questionId, 
  answerId, 
  onCancel 
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  
  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async () => {
      const data = {
        content: comment,
        ...(questionId ? { questionId } : {}),
        ...(answerId ? { answerId } : {})
      };
      
      return apiRequest("POST", `/api/comments`, data);
    },
    onSuccess: async () => {
      toast({
        title: "Success!",
        description: "Your comment has been added.",
      });
      // Reset form
      setComment("");
      // Close form if onCancel provided
      if (onCancel) onCancel();
      
      // Invalidate queries to refetch with new comment
      if (questionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
      } else if (answerId) {
        // Since answers are fetched with questions, invalidate the parent question
        const answerResponse = await apiRequest("GET", `/api/answers/${answerId}`);
        const answerData = await answerResponse.json();
        if (answerData.questionId) {
          queryClient.invalidateQueries({ queryKey: [`/api/questions/${answerData.questionId}`] });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    if (comment.trim().length < 5) {
      toast({
        title: "Error",
        description: "Comment must be at least 5 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    createComment.mutate();
  };

  // If not authenticated, show a prompt to log in
  if (!isAuthenticated) {
    return (
      <div className="text-center py-2">
        <Button
          variant="link"
          onClick={() => { window.location.href = "/api/login"; }}
        >
          Log in to add a comment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <Textarea
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[60px]"
        disabled={createComment.isPending}
      />
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={createComment.isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={comment.trim().length < 5 || createComment.isPending}
        >
          {createComment.isPending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Posting...
            </>
          ) : (
            "Add Comment"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
