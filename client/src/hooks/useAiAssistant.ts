import { useState } from "react";
import { sendMessageToAI } from "@/lib/openai";
import { useAiAvailability } from "./useAiAvailability";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

export function useAiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAiAvailable } = useAiAvailability();

  async function sendMessage(userMessage: string) {
    try {
      setIsLoading(true);
      
      // Add user message to the conversation
      const userMsg: Message = { role: "user", content: userMessage };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      
      // If AI is not available, return a message indicating so
      if (!isAiAvailable) {
        const aiUnavailableMessage = "AI assistant is not available. Please add an OpenAI API key to enable this feature.";
        const assistantMsg: Message = { role: "assistant", content: aiUnavailableMessage };
        setMessages([...newMessages, assistantMsg]);
        return aiUnavailableMessage;
      }
      
      // Format history for the API
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Get response from AI
      const response = await sendMessageToAI(userMessage, history);
      
      // Add AI response to the conversation
      const assistantResponse: Message = { role: "assistant", content: response };
      setMessages([...newMessages, assistantResponse]);
      
      return response;
    } catch (error) {
      console.error("Error in AI assistant:", error);
      // Add error message to the conversation
      const errorMessage = "Sorry, there was an error processing your request. Please try again later.";
      const userMsg: Message = { role: "user", content: userMessage };
      const errorMsg: Message = { role: "assistant", content: errorMessage };
      setMessages([...messages, userMsg, errorMsg]);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
  }

  return {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    isAiAvailable,
  };
}
