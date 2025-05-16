import {
  users,
  type User,
  type UpsertUser,
  type Question,
  type Answer,
  type Tag,
  type Comment,
  type Vote,
  type AiSuggestion,
  questions,
  answers,
  tags,
  comments,
  votes,
  aiSuggestions,
  questionTags,
  type InsertQuestion,
  type InsertAnswer,
  type InsertTag,
  type InsertComment,
  type InsertVote,
  type InsertAiSuggestion,
  type QuestionWithDetails,
  type AnswerWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserReputation(userId: string, change: number): Promise<void>;
  getTopContributors(limit?: number): Promise<User[]>;
  
  // Question operations
  getQuestions(options?: { 
    limit?: number; 
    offset?: number; 
    sortBy?: string;
    tagIds?: number[];
    searchQuery?: string;
  }): Promise<{ questions: QuestionWithDetails[]; total: number }>;
  getQuestionById(id: number): Promise<QuestionWithDetails | undefined>;
  createQuestion(question: InsertQuestion, tagIds: number[]): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  incrementQuestionViewCount(id: number): Promise<void>;
  markQuestionAsSolved(id: number, answerId: number): Promise<void>;
  
  // Answer operations
  getAnswerById(id: number): Promise<AnswerWithDetails | undefined>;
  getAnswersByQuestionId(questionId: number): Promise<AnswerWithDetails[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined>;
  markAnswerAsAccepted(id: number): Promise<void>;
  
  // Tag operations
  getTags(options?: { limit?: number; offset?: number; }): Promise<{ tags: Tag[]; total: number }>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getPopularTags(limit?: number): Promise<Tag[]>;
  
  // Comment operations
  getCommentsByQuestionId(questionId: number): Promise<(Comment & { user: User })[]>;
  getCommentsByAnswerId(answerId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Vote operations
  getVoteByUser(userId: string, questionId?: number, answerId?: number): Promise<Vote | undefined>;
  createOrUpdateVote(vote: InsertVote): Promise<void>;
  
  // AI Suggestion operations
  getAiSuggestionByQuestionId(questionId: number): Promise<AiSuggestion | undefined>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserReputation(userId: string, change: number): Promise<void> {
    await db
      .update(users)
      .set({
        reputation: sql`${users.reputation} + ${change}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getTopContributors(limit: number = 10): Promise<User[]> {
    const topUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.reputation))
      .limit(limit);
    
    return topUsers;
  }

  // Question operations
  async getQuestions(options: { 
    limit?: number; 
    offset?: number; 
    sortBy?: string;
    tagIds?: number[];
    searchQuery?: string;
  } = {}): Promise<{ questions: QuestionWithDetails[]; total: number }> {
    const {
      limit = 10,
      offset = 0,
      sortBy = "newest",
      tagIds = [],
      searchQuery = "",
    } = options;

    // Build query conditions
    let conditions = true;
    
    // Filter by tags if provided
    if (tagIds.length > 0) {
      // Get question IDs that have all the specified tags
      const questionIdsWithTags = await db
        .select({ questionId: questionTags.questionId })
        .from(questionTags)
        .where(inArray(questionTags.tagId, tagIds))
        .groupBy(questionTags.questionId)
        .having({ count: sql`count(${questionTags.tagId}) = ${tagIds.length}` });
      
      if (questionIdsWithTags.length === 0) {
        return { questions: [], total: 0 };
      }
      
      conditions = and(
        conditions,
        inArray(questions.id, questionIdsWithTags.map(q => q.questionId))
      );
    }
    
    // Filter by search query if provided
    if (searchQuery) {
      conditions = and(
        conditions,
        or(
          ilike(questions.title, `%${searchQuery}%`),
          ilike(questions.content, `%${searchQuery}%`)
        )
      );
    }

    // Get sorting
    let orderByClause;
    switch (sortBy) {
      case "newest":
        orderByClause = [desc(questions.createdAt)];
        break;
      case "votes":
        orderByClause = [desc(questions.votes), desc(questions.createdAt)];
        break;
      case "views":
        orderByClause = [desc(questions.viewCount), desc(questions.createdAt)];
        break;
      case "active":
        orderByClause = [desc(questions.updatedAt)];
        break;
      default:
        orderByClause = [desc(questions.createdAt)];
    }

    // Count total questions matching the conditions
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(questions)
      .where(conditions);

    // Get questions with users
    const questionsResult = await db
      .select()
      .from(questions)
      .where(conditions)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get user data for each question
    const questionUsers = await db
      .select()
      .from(users)
      .where(inArray(
        users.id,
        questionsResult.map((q) => q.userId)
      ));

    const userMap = new Map(questionUsers.map((user) => [user.id, user]));

    // Get tags for each question
    const questionIds = questionsResult.map((q) => q.id);
    
    const questionTagsData = await db
      .select({
        questionId: questionTags.questionId,
        tag: tags,
      })
      .from(questionTags)
      .innerJoin(tags, eq(questionTags.tagId, tags.id))
      .where(inArray(questionTags.questionId, questionIds));

    // Get answer counts for each question
    const answerCounts = await db
      .select({
        questionId: answers.questionId,
        count: sql<number>`count(*)`,
      })
      .from(answers)
      .where(inArray(answers.questionId, questionIds))
      .groupBy(answers.questionId);

    const answerCountMap = new Map(
      answerCounts.map((item) => [item.questionId, item.count])
    );

    // Get AI suggestions for each question
    const aiSuggestionsData = await db
      .select()
      .from(aiSuggestions)
      .where(inArray(aiSuggestions.questionId, questionIds));

    const aiSuggestionMap = new Map(
      aiSuggestionsData.map((suggestion) => [suggestion.questionId, suggestion])
    );

    // Group tags by question ID
    const tagsByQuestionId = questionTagsData.reduce((acc, { questionId, tag }) => {
      if (!acc.has(questionId)) {
        acc.set(questionId, []);
      }
      acc.get(questionId)!.push(tag);
      return acc;
    }, new Map<number, Tag[]>());

    // Build complete question objects with users, tags, and answer counts
    const questionWithDetails = questionsResult.map((question) => {
      return {
        ...question,
        user: userMap.get(question.userId)!,
        tags: tagsByQuestionId.get(question.id) || [],
        answerCount: answerCountMap.get(question.id) || 0,
        aiSuggestion: aiSuggestionMap.get(question.id),
      };
    });

    return { questions: questionWithDetails, total };
  }

  async getQuestionById(id: number): Promise<QuestionWithDetails | undefined> {
    // Get the question
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));

    if (!question) return undefined;

    // Get the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, question.userId));

    // Get the tags
    const questionTagsData = await db
      .select({
        tag: tags,
      })
      .from(questionTags)
      .innerJoin(tags, eq(questionTags.tagId, tags.id))
      .where(eq(questionTags.questionId, id));

    const questionTags = questionTagsData.map((qt) => qt.tag);

    // Get comments for this question
    const commentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.questionId, id))
      .orderBy(asc(comments.createdAt));

    const questionComments = commentsData.map(({ comment, user }) => ({
      ...comment,
      user,
    }));

    // Get AI suggestion for this question
    const [aiSuggestion] = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.questionId, id));

    return {
      ...question,
      user,
      tags: questionTags,
      comments: questionComments,
      aiSuggestion,
    };
  }

  async createQuestion(question: InsertQuestion, tagIds: number[]): Promise<Question> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the question
      const [createdQuestion] = await tx
        .insert(questions)
        .values(question)
        .returning();

      // Link the question with tags
      if (tagIds.length > 0) {
        await tx
          .insert(questionTags)
          .values(
            tagIds.map((tagId) => ({
              questionId: createdQuestion.id,
              tagId,
            }))
          );
          
        // Increment the count for each tag
        await tx
          .update(tags)
          .set({ count: sql`${tags.count} + 1` })
          .where(inArray(tags.id, tagIds));
      }

      return createdQuestion;
    });
  }

  async updateQuestion(
    id: number,
    questionData: Partial<InsertQuestion>
  ): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        ...questionData,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    return updatedQuestion;
  }

  async incrementQuestionViewCount(id: number): Promise<void> {
    await db
      .update(questions)
      .set({
        viewCount: sql`${questions.viewCount} + 1`,
      })
      .where(eq(questions.id, id));
  }

  async markQuestionAsSolved(id: number, answerId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Mark the question as solved
      await tx
        .update(questions)
        .set({
          isSolved: true,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id));

      // Mark the answer as accepted
      await tx
        .update(answers)
        .set({
          isAccepted: true,
          updatedAt: new Date(),
        })
        .where(eq(answers.id, answerId));
    });
  }

  // Answer operations
  async getAnswerById(id: number): Promise<AnswerWithDetails | undefined> {
    const [answer] = await db
      .select()
      .from(answers)
      .where(eq(answers.id, id));

    if (!answer) return undefined;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, answer.userId));

    const commentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.answerId, id))
      .orderBy(asc(comments.createdAt));

    const answerComments = commentsData.map(({ comment, user }) => ({
      ...comment,
      user,
    }));

    return {
      ...answer,
      user,
      comments: answerComments,
    };
  }

  async getAnswersByQuestionId(questionId: number): Promise<AnswerWithDetails[]> {
    const answersData = await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.isAccepted), desc(answers.votes), asc(answers.createdAt));

    if (answersData.length === 0) return [];

    // Get users for all answers
    const userIds = [...new Set(answersData.map((a) => a.userId))];
    const usersData = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));

    const userMap = new Map(usersData.map((user) => [user.id, user]));

    // Get comments for all answers
    const answerIds = answersData.map((a) => a.id);
    const commentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(
        eq(comments.questionId, questionId),
        inArray(comments.answerId, answerIds)
      ))
      .orderBy(asc(comments.createdAt));

    // Group comments by answer ID
    const commentsByAnswerId = commentsData.reduce((acc, { comment, user }) => {
      const answerId = comment.answerId!;
      if (!acc.has(answerId)) {
        acc.set(answerId, []);
      }
      acc.get(answerId)!.push({ ...comment, user });
      return acc;
    }, new Map<number, (Comment & { user: User })[]>());

    return answersData.map((answer) => ({
      ...answer,
      user: userMap.get(answer.userId)!,
      comments: commentsByAnswerId.get(answer.id) || [],
    }));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [createdAnswer] = await db
      .insert(answers)
      .values(answer)
      .returning();

    return createdAnswer;
  }

  async updateAnswer(
    id: number,
    answerData: Partial<InsertAnswer>
  ): Promise<Answer | undefined> {
    const [updatedAnswer] = await db
      .update(answers)
      .set({
        ...answerData,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, id))
      .returning();

    return updatedAnswer;
  }

  async markAnswerAsAccepted(id: number): Promise<void> {
    const [answer] = await db
      .select()
      .from(answers)
      .where(eq(answers.id, id));

    if (!answer) return;

    await db.transaction(async (tx) => {
      // Mark this answer as accepted
      await tx
        .update(answers)
        .set({
          isAccepted: true,
          updatedAt: new Date(),
        })
        .where(eq(answers.id, id));

      // Mark the question as solved
      await tx
        .update(questions)
        .set({
          isSolved: true,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, answer.questionId));
    });
  }

  // Tag operations
  async getTags(options: { limit?: number; offset?: number } = {}): Promise<{ tags: Tag[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(tags);

    const tagsData = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.count))
      .limit(limit)
      .offset(offset);

    return { tags: tagsData, total };
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id));

    return tag;
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, name));

    return tag;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [createdTag] = await db
      .insert(tags)
      .values(tag)
      .returning();

    return createdTag;
  }

  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    const popularTags = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.count))
      .limit(limit);

    return popularTags;
  }

  // Comment operations
  async getCommentsByQuestionId(questionId: number): Promise<(Comment & { user: User })[]> {
    const commentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(
        eq(comments.questionId, questionId),
        isNull(comments.answerId)
      ))
      .orderBy(asc(comments.createdAt));

    return commentsData.map(({ comment, user }) => ({
      ...comment,
      user,
    }));
  }

  async getCommentsByAnswerId(answerId: number): Promise<(Comment & { user: User })[]> {
    const commentsData = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.answerId, answerId))
      .orderBy(asc(comments.createdAt));

    return commentsData.map(({ comment, user }) => ({
      ...comment,
      user,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db
      .insert(comments)
      .values(comment)
      .returning();

    return createdComment;
  }

  // Vote operations
  async getVoteByUser(
    userId: string,
    questionId?: number,
    answerId?: number
  ): Promise<Vote | undefined> {
    let conditions = eq(votes.userId, userId);

    if (questionId) {
      conditions = and(conditions, eq(votes.questionId, questionId));
    }

    if (answerId) {
      conditions = and(conditions, eq(votes.answerId, answerId));
    }

    const [vote] = await db
      .select()
      .from(votes)
      .where(conditions);

    return vote;
  }

  async createOrUpdateVote(vote: InsertVote): Promise<void> {
    await db.transaction(async (tx) => {
      // Check if vote already exists
      const conditions = and(
        eq(votes.userId, vote.userId),
        vote.questionId
          ? eq(votes.questionId, vote.questionId)
          : isNull(votes.questionId),
        vote.answerId
          ? eq(votes.answerId, vote.answerId)
          : isNull(votes.answerId)
      );

      const [existingVote] = await tx
        .select()
        .from(votes)
        .where(conditions);

      // Update the vote count on the question or answer
      const voteCountChange = existingVote ? vote.value - existingVote.value : vote.value;
      
      if (vote.questionId) {
        await tx
          .update(questions)
          .set({
            votes: sql`${questions.votes} + ${voteCountChange}`,
            updatedAt: new Date(),
          })
          .where(eq(questions.id, vote.questionId));

        // Update user reputation
        if (voteCountChange !== 0) {
          const [question] = await tx
            .select({ userId: questions.userId })
            .from(questions)
            .where(eq(questions.id, vote.questionId));
          
          if (question) {
            await this.updateUserReputation(question.userId, voteCountChange * 5);
          }
        }
      } else if (vote.answerId) {
        await tx
          .update(answers)
          .set({
            votes: sql`${answers.votes} + ${voteCountChange}`,
            updatedAt: new Date(),
          })
          .where(eq(answers.id, vote.answerId));

        // Update user reputation
        if (voteCountChange !== 0) {
          const [answer] = await tx
            .select({ userId: answers.userId })
            .from(answers)
            .where(eq(answers.id, vote.answerId));
          
          if (answer) {
            await this.updateUserReputation(answer.userId, voteCountChange * 10);
          }
        }
      }

      // Insert or update the vote
      if (existingVote) {
        await tx
          .update(votes)
          .set({ value: vote.value })
          .where(conditions);
      } else {
        await tx
          .insert(votes)
          .values(vote);
      }
    });
  }

  // AI Suggestion operations
  async getAiSuggestionByQuestionId(questionId: number): Promise<AiSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.questionId, questionId));

    return suggestion;
  }

  async createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const [createdSuggestion] = await db
      .insert(aiSuggestions)
      .values(suggestion)
      .returning();

    return createdSuggestion;
  }
}

export const storage = new DatabaseStorage();
