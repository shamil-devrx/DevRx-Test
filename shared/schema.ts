import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  primaryKey,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  reputation: integer("reputation").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tags for questions and solutions
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questions/Incidents table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  votes: integer("votes").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  isSolved: boolean("is_solved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Question tags junction table
export const questionTags = pgTable(
  "question_tags",
  {
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.questionId, t.tagId] }),
  })
);

// Answers/Solutions table
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  votes: integer("votes").default(0).notNull(),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table (for both questions and answers)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questions.id, {
    onDelete: "cascade",
  }),
  answerId: integer("answer_id").references(() => answers.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Votes table (for both questions and answers)
export const votes = pgTable(
  "votes",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id").references(() => questions.id, {
      onDelete: "cascade",
    }),
    answerId: integer("answer_id").references(() => answers.id, {
      onDelete: "cascade",
    }),
    value: integer("value").notNull(), // 1 for upvote, -1 for downvote
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userQuestionPk: primaryKey({
      columns: [t.userId, t.questionId],
      name: "user_question_pk",
    }),
    userAnswerPk: primaryKey({
      columns: [t.userId, t.answerId],
      name: "user_answer_pk",
    }),
  })
);

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users);
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, count: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, votes: true, viewCount: true, isSolved: true, createdAt: true, updatedAt: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, votes: true, isAccepted: true, createdAt: true, updatedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ createdAt: true });
export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

// Relation type definitions
export type QuestionWithDetails = Question & {
  user: User;
  tags: Tag[];
  answers?: (Answer & { user: User })[];
  comments?: (Comment & { user: User })[];
  aiSuggestion?: AiSuggestion;
};

export type AnswerWithDetails = Answer & {
  user: User;
  comments?: (Comment & { user: User })[];
};
