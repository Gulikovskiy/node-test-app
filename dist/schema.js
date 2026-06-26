"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksSchema = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.tasksSchema = (0, pg_core_1.pgTable)("tasks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull().default(""),
});
