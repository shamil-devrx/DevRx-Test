import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoteControlsProps {
  votes: number;
  questionId?: number;
  answerId?: number;
  isAuthenticated: boolean;
  className?: string;
}

const VoteControls: React.FC<VoteControlsProps> = ({ 
  votes, 
  questionId, 
  answerId, 
  isAuthenticated,
  className 
}) => {
  const { toast } = useToast();

  const voteMutation = useMutation({
    mutationFn: async (value: number) => {
      const voteData = {
        value,
        ...(questionId ? { questionId } : {}),
        ...(answerId ? { answerId } : {})
      };
      
      return apiRequest("POST", "/api/votes", voteData);
    },
    onSuccess: () => {
      // Invalidate the relevant query to refresh data
      if (questionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleVote = (value: number) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    voteMutation.mutate(value);
  };

  return (
    <div className={className}>
      <button 
        className="text-neutral-400 hover:text-primary-500"
        onClick={() => handleVote(1)}
        disabled={voteMutation.isPending}
        aria-label="Upvote"
      >
        <ChevronUp className="h-8 w-8" />
      </button>
      <span className="text-lg font-bold text-neutral-700">{votes}</span>
      <button 
        className="text-neutral-400 hover:text-error-500"
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isPending}
        aria-label="Downvote"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </div>
  );
};

export default VoteControls;
