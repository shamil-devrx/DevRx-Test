import { useState } from "react";
import { sendMessageToAI } from "@/lib/openai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function useAiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(userMessage: string) {
    try {
      setIsLoading(true);
      
      // Add user message to the conversation
      const newMessages = [...messages, { role: "user", content: userMessage }];
      setMessages(newMessages);
      
      // Format history for the API
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Get response from AI
      const response = await sendMessageToAI(userMessage, history);
      
      // Add AI response to the conversation
      setMessages([...newMessages, { role: "assistant", content: response }]);
      
      return response;
    } catch (error) {
      console.error("Error in AI assistant:", error);
      throw error;
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
  };
}
