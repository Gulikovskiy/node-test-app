import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { NewTask, Task } from "./types";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

export async function findItemById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasksSchema).where(eq(schema.tasksSchema.id, Number(id)));
    return task;
}

export  async function listTasks(){
     return await db.select().from(schema.tasksSchema);
}

export async function createTask(input: NewTask): Promise<Task> {
  const [created] = await db.insert(schema.tasksSchema).values(input).returning();
  return created;
}

export async function updateTask(task: Task) {
  const { id, ...updates } = task;
  await db.update(schema.tasksSchema).set(updates).where(eq(schema.tasksSchema.id, id));
}

export  async function deleteTask(task:Task){ 
    await db.delete(schema.tasksSchema).where(eq(schema.tasksSchema.id, task.id))
}
