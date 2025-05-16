import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, ArrowUpCircle, CheckCircle, Loader2 } from "lucide-react";
import VoteControls from "@/components/VoteControls";
import TagsList from "@/components/TagsList";
import UserAvatar from "@/components/UserAvatar";
import AiSuggestion from "@/components/AiSuggestion";
import AnswerForm from "@/components/AnswerForm";
import CommentForm from "@/components/CommentForm";

interface QuestionDetailProps {
  params: {
    id: string;
  };
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({ params }) => {
  const questionId = parseInt(params.id);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  
  // Fetch question details
  const { data: question, isLoading, error } = useQuery({
    queryKey: [`/api/questions/${questionId}`],
  });
  
  // Accept answer mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      return apiRequest("PUT", `/api/answers/${answerId}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Answer marked as accepted",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle accept answer
  const handleAcceptAnswer = (answerId: number) => {
    acceptAnswerMutation.mutate(answerId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-error-500 mb-2">Error Loading Question</h2>
        <p className="text-neutral-600 mb-4">The question you're looking for couldn't be found or there was an error.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const isQuestionAuthor = user?.id === question.user.id;
  const isQuestionSolved = question.isSolved;

  return (
    <div className="space-y-6">
      {/* Question section */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row">
            {/* Voting controls */}
            <VoteControls 
              votes={question.votes} 
              questionId={question.id}
              isAuthenticated={isAuthenticated}
              className="md:pr-6 flex md:flex-col items-center md:items-start mb-4 md:mb-0 space-x-4 md:space-x-0 md:space-y-2"
            />

            {/* Question content */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{question.title}</h1>
                {question.isSolved && (
                  <Badge className="bg-success-500 hover:bg-success-500 ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Solved
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-sm text-neutral-500 mb-4">
                <span>Asked {formatDate(question.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>Viewed {question.viewCount} times</span>
              </div>

              <div className="prose max-w-none mb-4">
                <p className="text-neutral-700 whitespace-pre-line">{question.content}</p>
              </div>
              
              <TagsList tags={question.tags} className="mb-4" />
              
              <div className="flex items-center justify-end mt-4">
                <UserAvatar user={question.user} className="w-6 h-6 rounded-full object-cover mr-2" />
                <span className="text-primary-500">{question.user.firstName || question.user.email?.split('@')[0] || 'User'}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* AI Suggestion */}
        {question.aiSuggestion && (
          <AiSuggestion content={question.aiSuggestion.content} />
        )}
        
        {/* Comments */}
        {question.comments && question.comments.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-3 bg-neutral-50">
            <h3 className="text-sm font-medium text-neutral-900 mb-2">Comments</h3>
            <ul className="space-y-3">
              {question.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <div className="flex">
                    <div className="flex-1">
                      <p className="text-neutral-700">{comment.content}</p>
                      <div className="flex items-center mt-1 text-xs text-neutral-500">
                        <span>– {comment.user.firstName || comment.user.email?.split('@')[0]}</span>
                        <span className="ml-2">{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Comment form */}
        <div className="border-t border-neutral-200 px-6 py-3">
          {showCommentForm === question.id ? (
            <CommentForm 
              questionId={question.id} 
              onCancel={() => setShowCommentForm(null)} 
            />
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm flex items-center"
              onClick={() => {
                if (isAuthenticated) {
                  setShowCommentForm(question.id);
                } else {
                  window.location.href = "/api/login";
                }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Add a comment
            </Button>
          )}
        </div>
      </Card>

      {/* Answers section */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold border-b border-neutral-200 pb-2">
          {question.answers?.length || 0} Answers
        </h2>
        
        {question.answers && question.answers.length > 0 ? (
          question.answers.map((answer) => (
            <Card key={answer.id} className="bg-white shadow rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row">
                  {/* Voting controls */}
                  <div className="md:pr-6 flex md:flex-col items-center md:items-start mb-4 md:mb-0 space-x-4 md:space-x-0 md:space-y-2">
                    <VoteControls 
                      votes={answer.votes} 
                      answerId={answer.id}
                      isAuthenticated={isAuthenticated}
                      className="flex md:flex-col items-center space-x-4 md:space-x-0 md:space-y-2"
                    />
                    
                    {/* Accept answer button (only shown to question author if question is not solved yet) */}
                    {isQuestionAuthor && !isQuestionSolved && !answer.isAccepted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success-500 hover:text-success-600 hover:bg-success-50 mt-2"
                        onClick={() => handleAcceptAnswer(answer.id)}
                        disabled={acceptAnswerMutation.isPending}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    )}
                    
                    {/* Accepted answer indicator */}
                    {answer.isAccepted && (
                      <div className="flex items-center text-success-500 mt-2">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="text-xs font-medium">Accepted</span>
                      </div>
                    )}
                  </div>

                  {/* Answer content */}
                  <div className="flex-1">
                    <div className="prose max-w-none mb-4">
                      <p className="text-neutral-700 whitespace-pre-line">{answer.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-end mt-4">
                      <UserAvatar user={answer.user} className="w-6 h-6 rounded-full object-cover mr-2" />
                      <span className="text-primary-500">{answer.user.firstName || answer.user.email?.split('@')[0] || 'User'}</span>
                      <span className="ml-2 text-neutral-500 text-sm">
                        answered {formatDate(answer.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {/* Comments */}
              {answer.comments && answer.comments.length > 0 && (
                <div className="border-t border-neutral-200 px-6 py-3 bg-neutral-50">
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">Comments</h3>
                  <ul className="space-y-3">
                    {answer.comments.map((comment) => (
                      <li key={comment.id} className="text-sm">
                        <div className="flex">
                          <div className="flex-1">
                            <p className="text-neutral-700">{comment.content}</p>
                            <div className="flex items-center mt-1 text-xs text-neutral-500">
                              <span>– {comment.user.firstName || comment.user.email?.split('@')[0]}</span>
                              <span className="ml-2">{formatDate(comment.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Comment form */}
              <div className="border-t border-neutral-200 px-6 py-3">
                {showCommentForm === answer.id ? (
                  <CommentForm 
                    answerId={answer.id} 
                    onCancel={() => setShowCommentForm(null)} 
                  />
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm flex items-center"
                    onClick={() => {
                      if (isAuthenticated) {
                        setShowCommentForm(answer.id);
                      } else {
                        window.location.href = "/api/login";
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Add a comment
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-5 border border-dashed border-neutral-300 rounded-lg bg-neutral-50">
            <p className="text-neutral-600 mb-2">No answers yet. Be the first to answer!</p>
          </div>
        )}
      </div>

      {/* Your Answer form */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Answer</h2>
        <AnswerForm questionId={questionId} />
      </div>
    </div>
  );
};

export default QuestionDetail;
