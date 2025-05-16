import React from "react";
import { Link } from "wouter";
import { Eye, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import VoteControls from "./VoteControls";
import TagsList from "./TagsList";
import UserAvatar from "./UserAvatar";
import AiSuggestion from "./AiSuggestion";
import { useAuth } from "@/hooks/useAuth";
import { QuestionWithDetails } from "@shared/schema";

interface QuestionCardProps {
  question: QuestionWithDetails;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { isAuthenticated } = useAuth();
  const { id, title, content, votes, createdAt, user, tags, viewCount, aiSuggestion } = question;
  const answerCount = question.answers?.length || 0;

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row">
          {/* Voting controls */}
          <VoteControls 
            votes={votes} 
            questionId={id}
            isAuthenticated={isAuthenticated}
            className="md:pr-6 flex md:flex-col items-center md:items-start mb-4 md:mb-0 space-x-4 md:space-x-0 md:space-y-2"
          />

          {/* Question content */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              <Link href={`/questions/${id}`}>
                <a className="hover:text-primary-500">{title}</a>
              </Link>
            </h2>
            <p className="text-neutral-700 mb-4">{content.length > 200 ? `${content.substring(0, 200)}...` : content}</p>
            
            <TagsList tags={tags} className="mb-4" />
            
            <div className="flex flex-wrap items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-neutral-500">
                  <Eye className="h-5 w-5 mr-1" />
                  {viewCount} views
                </div>
                <div className="flex items-center text-neutral-500">
                  <MessageSquare className="h-5 w-5 mr-1" />
                  {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
                </div>
              </div>
              
              <div className="flex items-center mt-2 sm:mt-0">
                <div className="flex items-center">
                  <UserAvatar user={user} className="w-6 h-6 rounded-full object-cover mr-2" />
                  <Link href={`/users/${user.id}`}>
                    <a className="text-primary-500 hover:text-primary-700">
                      {user.firstName || user.email?.split('@')[0] || 'User'}
                    </a>
                  </Link>
                </div>
                <span className="mx-2 text-neutral-500">asked {formatDate(createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {aiSuggestion && <AiSuggestion content={aiSuggestion.content} />}
    </Card>
  );
};

export default QuestionCard;
