"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const services_1 = require("./services");
const store_1 = require("./store");
const schema_1 = require("./schema");
const drizzle_orm_1 = require("drizzle-orm");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
app.use(express_1.default.json());
// let nextItemId = 3;
const getNextId = async () => (await store_1.db.select().from(schema_1.tasksSchema)).length + 1;
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
app.get("/tasks", async (req, res) => {
    const tasks = await store_1.db.select().from(schema_1.tasksSchema);
    res.json({ data: tasks });
});
app.get("/tasks/:id", async (req, res, next) => {
    if ((0, services_1.isInvalidId)(req.params.id)) {
        return next((0, services_1.createHttpError)(400, "Bad Request. Invalid params"));
    }
    const item = await (0, store_1.findItemById)(req.params.id);
    if (!item) {
        return next((0, services_1.createHttpError)(404, "Task not found"));
    }
    res.json({ data: item });
});
app.post("/tasks", async (req, res, next) => {
    const { name, description = "" } = req.body;
    const error = (0, services_1.validateTaskInput)({ name, description });
    if (error)
        return next(error);
    const task = {
        id: await getNextId(),
        name: String(name).trim(),
        description: String(description).trim()
    };
    await store_1.db.insert(schema_1.tasksSchema).values(task);
    res.status(201).json({ data: task });
});
app.patch("/tasks/:id", async (req, res, next) => {
    if ((0, services_1.isInvalidId)(req.params.id)) {
        return next((0, services_1.createHttpError)(400, "Bad Request. Invalid params"));
    }
    const item = await (0, store_1.findItemById)(req.params.id);
    if (!item) {
        return next((0, services_1.createHttpError)(404, "Task not found"));
    }
    const { name, description } = req.body;
    const error = (0, services_1.validateTaskInput)({ name, description }, { partial: true });
    if (error)
        return next(error);
    if (name !== undefined) {
        item.name = String(name).trim();
    }
    if (description !== undefined) {
        item.description = String(description).trim();
    }
    res.json({ data: item });
});
app.delete("/tasks/:id", async (req, res, next) => {
    if ((0, services_1.isInvalidId)(req.params.id)) {
        return next((0, services_1.createHttpError)(400, "Bad Request. Invalid params"));
    }
    const item = await (0, store_1.findItemById)(req.params.id);
    if (!item) {
        return next((0, services_1.createHttpError)(404, "Task not found"));
    }
    await store_1.db.delete(schema_1.tasksSchema).where((0, drizzle_orm_1.eq)(schema_1.tasksSchema.id, item.id));
    res.status(204).send();
});
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: "Route not found"
        }
    });
});
app.use((err, req, res, next) => {
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
