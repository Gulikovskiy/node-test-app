# Node Test App

Simple TypeScript + Express REST API using in-memory data.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

The API starts on `http://localhost:3000` by default.

For a production-style run:

```bash
npm run build
npm start
```

## Endpoints

- `GET /health` - health check
- `GET /api/items` - list all items
- `GET /api/items/:id` - get one item
- `POST /api/items` - create an item
- `PATCH /api/items/:id` - update an item
- `DELETE /api/items/:id` - delete an item

Example request:

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Learn Express","description":"Build a small REST API"}'
```
