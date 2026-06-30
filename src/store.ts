import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { NewTask, NewUser, Task, User } from "./types";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

export async function findItemById(id: string, userId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasksSchema).where(and(
            eq(schema.tasksSchema.id, Number(id)),
            eq(schema.tasksSchema.userId, userId)
        ));
    return task;
}

export async function listTasks(userId: number) {
  return db.select().from(schema.tasksSchema).where(eq(schema.tasksSchema.userId, userId));
}

export async function createTask(input: NewTask): Promise<Task> {
  const [created] = await db.insert(schema.tasksSchema).values(input).returning();
  return created;
}

export async function createUser(input: NewUser): Promise<User> {
  const [created] = await db.insert(schema.usersSchema).values(input).returning();
  return created;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(schema.usersSchema)
    .where(eq(schema.usersSchema.email, email));
  return user;
}

export async function updateTask(task: Task) {
  const { id, userId, ...updates } = task;
  await db
    .update(schema.tasksSchema)
    .set(updates)
    .where(and(
      eq(schema.tasksSchema.id, id),
      eq(schema.tasksSchema.userId, userId)
    ));
}

export async function deleteTask(task: Task) {
  await db
    .delete(schema.tasksSchema)
    .where(and(
      eq(schema.tasksSchema.id, task.id),
      eq(schema.tasksSchema.userId, task.userId)
    ));
}
