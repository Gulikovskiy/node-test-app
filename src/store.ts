import { Task } from "./types";
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(process.env.DATABASE_URL!);
console.log('db: ',db)

export const tasks: Task[] = [
  {
    id: 1,
    name: "First item",
    description: "This item lives in memory."
  },
  {
    id: 2,
    name: "Second item",
    description: "Restarting the server resets this data."
  }
];

export async function findItemById(id: string): Promise<Task | undefined> {
  return tasks.find((taks) => taks.id === Number(id));
}