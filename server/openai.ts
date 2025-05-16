import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Check if OpenAI API key is available
export const isAiAvailable = !!process.env.OPENAI_API_KEY;

// Initialize OpenAI client only if API key is available
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = isAiAvailable ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Generate suggestion for a question
export async function generateSuggestion(
  questionTitle: string,
  questionContent: string,
  tags: string[] = []
): Promise<string> {
  // Return a message if AI is not available
  if (!isAiAvailable || !openai) {
    return "AI suggestions are not available. Please add an OpenAI API key to enable this feature.";
  }
  
  try {
    const prompt = `
You are DevRx, an AI assistant that helps developers solve technical problems.
Based on the following question details, provide a helpful, concise technical suggestion:

TITLE: ${questionTitle}
CONTENT: ${questionContent}
TAGS: ${tags.join(', ')}

Provide a brief, technical suggestion that helps solve this issue or points them in the right direction.
Focus on practical advice, possible troubleshooting steps, or potential solutions.
Limit your response to 2-3 sentences maximum.
    `;

    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "user", 
        content: prompt 
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Unable to generate a suggestion at this time.";
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    return "Unable to generate a suggestion at this time. Please try again later.";
  }
}

// Generate response for an AI assistant chat
export async function generateAssistantResponse(
  questionContent: string,
  previousMessages: Array<ChatCompletionMessageParam> = []
): Promise<string> {
  // Return a message if AI is not available
  if (!isAiAvailable || !openai) {
    return "AI assistant is not available. Please add an OpenAI API key to enable this feature.";
  }
  
  try {
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `
You are DevRx, an AI technical assistant for developers.
Provide detailed, accurate and helpful responses to technical questions.
Use concise explanations, code examples when appropriate, and suggest best practices.
If you don't know the answer, admit that instead of making something up.
      `
    };

    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: questionContent
    };

    const messages: ChatCompletionMessageParam[] = [
      systemMessage,
      ...previousMessages,
      userMessage
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error generating AI assistant response:", error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
}

// Analyze question to generate related tags
export async function suggestTags(
  questionTitle: string,
  questionContent: string
): Promise<string[]> {
  // Return empty array if AI is not available
  if (!isAiAvailable || !openai) {
    console.log("AI tag suggestions are not available. Please add an OpenAI API key to enable this feature.");
    return [];
  }

  try {
    const prompt = `
Based on the following technical question, suggest up to 5 relevant tags that would categorize this question properly.
Return only a JSON array of tag names (lowercase, no special characters).

TITLE: ${questionTitle}
CONTENT: ${questionContent}

Example response format: ["javascript", "nodejs", "express", "authentication", "jwt"]
    `;

    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "user", 
        content: prompt 
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || "{}");
      return Array.isArray(result.tags) ? result.tags : [];
    } catch (e) {
      console.error("Error parsing tag suggestions:", e);
      return [];
    }
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
}
