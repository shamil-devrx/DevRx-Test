import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertAnswerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Extend schema with client-side validation
const answerFormSchema = insertAnswerSchema.extend({
  content: z.string().min(20, "Answer must be at least 20 characters")
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

interface AnswerFormProps {
  questionId: number;
}

const AnswerForm: React.FC<AnswerFormProps> = ({ questionId }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<AnswerFormValues>({
    resolver: zodResolver(answerFormSchema),
    defaultValues: {
      content: "",
      questionId
    },
  });

  // Create answer mutation
  const createAnswer = useMutation({
    mutationFn: async (data: AnswerFormValues) => {
      return apiRequest("POST", `/api/questions/${questionId}/answers`, data);
    },
    onSuccess: async () => {
      toast({
        title: "Success!",
        description: "Your answer has been posted.",
      });
      // Reset form
      form.reset();
      // Invalidate question query to refetch with new answer
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post your answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AnswerFormValues) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    createAnswer.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <p className="mb-4">You need to be logged in to post an answer.</p>
            <Button
              onClick={() => { window.location.href = "/api/login"; }}
            >
              Log In to Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your knowledge or experience to help solve this problem..."
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={createAnswer.isPending || !form.formState.isValid}
            >
              {createAnswer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Your Answer"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AnswerForm;
