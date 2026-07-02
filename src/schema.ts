import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const usersSchema = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("passwordHash").notNull(),
});

export const tasksSchema = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  userId: integer("userId")
    .notNull()
    .references(() => usersSchema.id),
});
