import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertAnswerSchema,
  insertCommentSchema,
  insertQuestionSchema,
  insertTagSchema,
  insertVoteSchema,
} from "@shared/schema";
import { generateAssistantResponse, generateSuggestion, suggestTags } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes for checking auth status
  app.get('/api/auth/status', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() });
  });

  // Questions routes
  app.get('/api/questions', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const sortBy = req.query.sortBy as string || 'newest';
      const searchQuery = req.query.search as string || '';
      
      let tagIds: number[] = [];
      if (req.query.tags) {
        tagIds = (req.query.tags as string).split(',').map(id => parseInt(id));
      }

      const { questions, total } = await storage.getQuestions({
        limit,
        offset,
        sortBy,
        tagIds,
        searchQuery,
      });

      res.json({ questions, total });
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Increment view count
      await storage.incrementQuestionViewCount(id);
      
      const question = await storage.getQuestionById(id);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Get answers for this question
      const answers = await storage.getAnswersByQuestionId(id);
      
      res.json({ ...question, answers });
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        userId,
      });
      
      // Get tag IDs (create tags if they don't exist)
      const tagIds: number[] = [];
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          let tag = await storage.getTagByName(tagName);
          if (!tag) {
            tag = await storage.createTag({ name: tagName });
          }
          tagIds.push(tag.id);
        }
      }
      
      const question = await storage.createQuestion(questionData, tagIds);
      
      // Generate AI suggestion for the question
      try {
        const suggestion = await generateSuggestion(
          question.title,
          question.content,
          req.body.tags
        );
        
        await storage.createAiSuggestion({
          questionId: question.id,
          content: suggestion,
        });
      } catch (error) {
        console.error("Error generating AI suggestion:", error);
      }
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ message: "Failed to create question", error: String(error) });
    }
  });

  app.post('/api/questions/suggest-tags', async (req, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      const tags = await suggestTags(title, content);
      res.json({ tags });
    } catch (error) {
      console.error("Error suggesting tags:", error);
      res.status(500).json({ message: "Failed to suggest tags" });
    }
  });

  // Answer routes
  app.post('/api/questions/:questionId/answers', isAuthenticated, async (req: any, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const userId = req.user.claims.sub;
      
      const answerData = insertAnswerSchema.parse({
        ...req.body,
        questionId,
        userId,
      });
      
      const answer = await storage.createAnswer(answerData);
      
      // Add reputation for posting an answer
      await storage.updateUserReputation(userId, 5);
      
      res.status(201).json(answer);
    } catch (error) {
      console.error("Error creating answer:", error);
      res.status(400).json({ message: "Failed to create answer", error: String(error) });
    }
  });

  app.put('/api/answers/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const answerId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get the answer to check if it belongs to the question asked by the user
      const answer = await storage.getAnswerById(answerId);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      // Get the question to verify ownership
      const question = await storage.getQuestionById(answer.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if the authenticated user is the question author
      if (question.userId !== userId) {
        return res.status(403).json({ message: "Only the question author can accept answers" });
      }
      
      await storage.markAnswerAsAccepted(answerId);
      
      // Add reputation for having an answer accepted
      await storage.updateUserReputation(answer.userId, 15);
      
      res.json({ message: "Answer accepted" });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  // Comment routes
  app.post('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Ensure either questionId or answerId is provided, but not both
      if ((!req.body.questionId && !req.body.answerId) || (req.body.questionId && req.body.answerId)) {
        return res.status(400).json({ message: "Provide either questionId or answerId, but not both" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      
      // Get user data for the response
      const user = await storage.getUser(userId);
      
      res.status(201).json({ ...comment, user });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment", error: String(error) });
    }
  });

  // Vote routes
  app.post('/api/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Ensure either questionId or answerId is provided, but not both
      if ((!req.body.questionId && !req.body.answerId) || (req.body.questionId && req.body.answerId)) {
        return res.status(400).json({ message: "Provide either questionId or answerId, but not both" });
      }
      
      // Validate value is either 1 or -1
      if (req.body.value !== 1 && req.body.value !== -1) {
        return res.status(400).json({ message: "Vote value must be either 1 or -1" });
      }
      
      const voteData = insertVoteSchema.parse({
        ...req.body,
        userId,
      });
      
      await storage.createOrUpdateVote(voteData);
      
      res.json({ message: "Vote recorded" });
    } catch (error) {
      console.error("Error recording vote:", error);
      res.status(400).json({ message: "Failed to record vote", error: String(error) });
    }
  });

  // Tag routes
  app.get('/api/tags', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const { tags, total } = await storage.getTags({ limit, offset });
      
      res.json({ tags, total });
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get('/api/tags/popular', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const tags = await storage.getPopularTags(limit);
      
      res.json(tags);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      res.status(500).json({ message: "Failed to fetch popular tags" });
    }
  });

  app.post('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      
      // Check if tag already exists
      const existingTag = await storage.getTagByName(tagData.name);
      if (existingTag) {
        return res.status(409).json({ message: "Tag already exists", tag: existingTag });
      }
      
      const tag = await storage.createTag(tagData);
      
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(400).json({ message: "Failed to create tag", error: String(error) });
    }
  });

  // User routes
  app.get('/api/users/top-contributors', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const users = await storage.getTopContributors(limit);
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching top contributors:", error);
      res.status(500).json({ message: "Failed to fetch top contributors" });
    }
  });

  // AI assistant routes
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await generateAssistantResponse(message, history);
      
      res.json({ response });
    } catch (error) {
      console.error("Error getting AI response:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
