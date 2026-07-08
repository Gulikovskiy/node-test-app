import argon2 from "argon2";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "./config";
import { authenticate } from "./middleware";
import {
  createHttpError,
  isInvalidId,
  isUniqueViolation,
  validateLoginInput,
  validateRegisterInput,
  validateTaskInput,
} from "./services";
import {
  createTask,
  createUser,
  db,
  deleteTask,
  findItemById,
  findUserByEmail,
  listTasks,
  updateTask,
} from "./store";
import { HttpError, TaskParams } from "./types";

export const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/tasks", authenticate);

app.get("/health", (req: Request, res: Response) => {
  console.log('TEST')
  res.json({ status: "test" });
});

app.post("/auth/register", async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as {
    email?: unknown;
    password?: unknown;
  };
  const error = validateRegisterInput({ email, password });
  if (error) return next(error);

  try {
    const passwordHash = await argon2.hash(String(password));
    const created = await createUser({
      email: String(email).trim().toLowerCase(),
      passwordHash,
    });

    res.status(201).json({
      data: {
        id: created.id,
        email: created.email,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return next(createHttpError(409, "Email is already registered"));
    }
    return next(err);
  }
});

app.post("/auth/login", async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as {
    email?: unknown;
    password?: unknown;
  };
  const error = validateLoginInput({ email, password });
  if (error) return next(error);

  const unauthorizedError = createHttpError(401, "Invalid email or password");

  try {
    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      return next(unauthorizedError);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, String(password));
    if (!passwordMatches) {
      return next(unauthorizedError);
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });

    res.json({
      data: {
        token,
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.get("/tasks", async (req: Request, res: Response, _next: NextFunction) => {
  const tasks = await listTasks(req.userId!);
  res.json({ data: tasks });
});

app.get("/tasks/:id", async (req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }

  const item = await findItemById(req.params.id, req.userId!);
  if (!item) {
    return next(createHttpError(404, "Task not found"));
  }

  res.json({ data: item });
});

app.post("/tasks", async (req: Request, res: Response, next: NextFunction) => {
  const { name, description = "" } = req.body as {
    name?: unknown;
    description?: unknown;
  };
  const error = validateTaskInput({ name, description });
  if (error) return next(error);

  const created = await createTask({
    name: String(name).trim(),
    description: String(description).trim(),
    userId: req.userId!,
  });

  res.status(201).json({ data: created });
});

app.patch("/tasks/:id", async (req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }

  const item = await findItemById(req.params.id, req.userId!);

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
  await updateTask(item);
  res.json({ data: item });
});

app.delete("/tasks/:id", async (req: Request<TaskParams>, res: Response, next: NextFunction) => {
  if (isInvalidId(req.params.id)) {
    return next(createHttpError(400, "Bad Request. Invalid params"));
  }

  const item = await findItemById(req.params.id, req.userId!);

  if (!item) {
    return next(createHttpError(404, "Task not found"));
  }
  await deleteTask(item);
  res.status(204).send();
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: "Route not found",
    },
  });
});

app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({
    error: {
      message,
    },
  });
});

export async function startServer() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
