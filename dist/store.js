"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = void 0;
exports.findItemById = findItemById;
require("dotenv/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const db = (0, node_postgres_1.drizzle)(process.env.DATABASE_URL);
console.log('db: ', db);
exports.tasks = [
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
async function findItemById(id) {
    return exports.tasks.find((taks) => taks.id === Number(id));
}
