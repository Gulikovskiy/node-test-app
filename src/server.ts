import express, { type NextFunction, type Request, type Response } from "express";
import { createHttpError, isInvalidId, validateTaskInput } from "./services";
import { findItemById, tasks } from "./store";
import { HttpError, Task, TaskParams } from "./types";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

let nextItemId = 3;

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req: Request, res: Response) => {
  res.json({ data: tasks });
});

app.get("/tasks/:id", async(req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }
  const item = await findItemById(req.params.id);

  if (!item) {
    return next(createHttpError(404, "Task not found"));
  }

  res.json({ data: item });
});

app.post("/tasks", (req: Request, res: Response, next: NextFunction) => {
  const { name, description = "" } = req.body as {
    name?: unknown;
    description?: unknown;
  };
  const error = validateTaskInput({name,description});
  if (error) return next(error);

  const task: Task = {
    id: nextItemId,
    name: String(name).trim(),
    description: String(description).trim()
  };

  nextItemId += 1;
  tasks.push(task);

  res.status(201).json({ data: task });
});

app.patch("/tasks/:id", async(req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }
  const item = await findItemById(req.params.id);

  if (!item) {
    return next(createHttpError(404, "Task not found"));
  }

  const { name, description } = req.body as {
    name?: unknown;
    description?: unknown;
  };

  const error = validateTaskInput({ name, description }, { partial: true });
  if (error) return next(error);

  if (name !== undefined) {
    item.name = String(name).trim();
  }
  if (description !== undefined) {
    item.description = String(description).trim();
  }

  res.json({ data: item });
});

app.delete("/tasks/:id", (req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }
  const taskIndex = tasks.findIndex((task) => task.id === Number(req.params.id));

  if (taskIndex === -1) {
    return next(createHttpError(404, "Task not found"));
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: "Route not found"
    }
  });
});

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({
    error: {
      message
    }
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
