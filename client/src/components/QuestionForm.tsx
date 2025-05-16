import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getTagSuggestions } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { insertQuestionSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuitIcon, Loader2 } from "lucide-react";

// Extend schema with client-side validation
const questionFormSchema = insertQuestionSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be less than 150 characters"),
  content: z.string().min(20, "Description must be at least 20 characters"),
  tags: z.array(z.string()).min(1, "At least one tag is required").max(5, "Maximum 5 tags allowed")
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const QuestionForm: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [isLoadingTagSuggestions, setIsLoadingTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Initialize form with default values
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    },
  });

  const { isDirty, isValid } = form.formState;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoadingTagSuggestions) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated]);

  // Get tag suggestions when title and content have enough content
  useEffect(() => {
    const getTagRecommendations = async () => {
      const title = form.watch("title");
      const content = form.watch("content");
      
      if (title.length >= 15 && content.length >= 30) {
        setIsLoadingTagSuggestions(true);
        try {
          const suggestions = await getTagSuggestions(title, content);
          if (suggestions.length > 0) {
            setTagSuggestions(suggestions);
          }
        } catch (error) {
          console.error("Error getting tag suggestions:", error);
        } finally {
          setIsLoadingTagSuggestions(false);
        }
      }
    };

    // Debounce tag suggestions
    const timer = setTimeout(() => {
      if (form.watch("tags").length === 0) {
        getTagRecommendations();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [form.watch("title"), form.watch("content")]);

  // Create question mutation
  const createQuestion = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      return apiRequest("POST", "/api/questions", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Success!",
        description: "Your question has been posted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      navigate(`/questions/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post your question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: QuestionFormValues) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    createQuestion.mutate(data);
  };

  // Handle adding a tag
  const addTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, "-");
    
    if (normalizedTag && !currentTags.includes(normalizedTag) && currentTags.length < 5) {
      form.setValue("tags", [...currentTags, normalizedTag], { shouldValidate: true, shouldDirty: true });
    }
    setTagInput("");
  };

  // Handle removing a tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Handle tag input key press
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput) {
        addTag(tagInput);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
        <CardDescription>
          Be specific about what you're asking. Include all the necessary details, but keep it concise.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's your technical question? Be specific."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide details, context, and any relevant code or error messages."
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value.map((tag) => (
                        <div 
                          key={tag}
                          className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm flex items-center"
                        >
                          {tag}
                          <button
                            type="button"
                            className="ml-1 text-primary-600 hover:text-primary-800"
                            onClick={() => removeTag(tag)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Add tags (press Enter or comma to add)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => tagInput && addTag(tagInput)}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 tags to categorize your question (e.g., javascript, react, postgresql)
                    </p>
                    {isLoadingTagSuggestions && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating tag suggestions...</span>
                      </div>
                    )}
                    {tagSuggestions.length > 0 && field.value.length === 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium flex items-center gap-1 mb-1">
                          <BrainCircuitIcon className="h-4 w-4 text-primary-500" />
                          <span>Suggested tags:</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tagSuggestions.map((tag) => (
                            <Button
                              key={tag}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => addTag(tag)}
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={!isDirty || !isValid || createQuestion.isPending}
            >
              {createQuestion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Your Question"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
