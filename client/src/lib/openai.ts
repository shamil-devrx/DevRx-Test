import { apiRequest } from "./queryClient";
import { useAiAvailability } from "@/hooks/useAiAvailability";

// Send a message to the AI assistant
export async function sendMessageToAI(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/chat", {
      message,
      history,
    });

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw new Error("Failed to get response from AI assistant");
  }
}

// Get tag suggestions for a question
export async function getTagSuggestions(
  title: string,
  content: string
): Promise<string[]> {
  try {
    const response = await apiRequest("POST", "/api/questions/suggest-tags", {
      title,
      content,
    });

    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error("Error getting tag suggestions:", error);
    return [];
  }
}

// Custom hook to check if AI features are available
export function useAiFeatures() {
  const { isAiAvailable, isLoading } = useAiAvailability();
  
  return {
    isAiAvailable,
    isLoading,
    aiMessage: isAiAvailable 
      ? "AI assistant is ready to help" 
      : "AI features are currently disabled. Add an OpenAI API key to enable them."
  };
}
