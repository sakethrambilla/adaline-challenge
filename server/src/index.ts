import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Initialize SQLite database
async function initializeDatabase() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  return db;
}

async function orderedNodes() {
  const db = await initializeDatabase();
  const folders = await db.all("SELECT id, name, parentId, orderIndex, type FROM folders ORDER BY orderIndex");
  const items = await db.all("SELECT id, name, content, parentId, orderIndex, type FROM items ORDER BY orderIndex");
  const allNodes = [...folders, ...items].sort((a, b) => a.orderIndex - b.orderIndex);
  return allNodes;
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected");

  // Send initial state to new connection
  socket.on("requestInitialState", async () => {
    const allNodes = await orderedNodes();
    socket.emit("initialState", { nodes: allNodes });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  // Create new folder
  socket.on("createFolder", async (folderData) => {
    const db = await initializeDatabase();
    const id = uuidv4();
    await db.run(
      `INSERT INTO folders (id, name, parentId, orderIndex, type) VALUES (?, ?, ?, ?, 'folder')`,
      [id, folderData.name, folderData.parentId, folderData.orderIndex]
    );
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  // Create new item
  socket.on("createItem", async (itemData) => {
    const db = await initializeDatabase();
    const id = uuidv4();
    await db.run(
      `INSERT INTO items (id, name, content, parentId, orderIndex, type) VALUES (?, ?, ?, ?, ?, 'item')`,
      [id, itemData.name, itemData.content, itemData.parentId, itemData.orderIndex]
    );
        const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  // Update folder
  socket.on("updateFolder", async (folderData) => {
    const db = await initializeDatabase();
    await db.run(
      `UPDATE folders SET name = ?, parentId = ?, orderIndex = ? WHERE id = ?`,
      [folderData.name, folderData.parentId, folderData.orderIndex, folderData.id]
    );
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  // Update item
  socket.on("updateItem", async (itemData) => {
    const db = await initializeDatabase();
    await db.run(
      `UPDATE items SET name = ?, content = ?, parentId = ?, orderIndex = ? WHERE id = ?`,
      [itemData.name, itemData.content, itemData.parentId, itemData.orderIndex, itemData.id]
    );
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  // Delete folder
  socket.on("deleteFolder", async (folderId) => {
    const db = await initializeDatabase();
    await db.run("DELETE FROM items WHERE parentId = ?", folderId);
    await db.run("DELETE FROM folders WHERE id = ?", folderId);
    const   allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  // Delete item
  socket.on("deleteItem", async (itemId) => {
    const db = await initializeDatabase();
    await db.run("DELETE FROM items WHERE id = ?", itemId);
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });
});

// API endpoints
app.get("/api/nodes", async (req, res) => {
  const allNodes = await orderedNodes();
  res.json(allNodes);
});

app.get("/api/folders", async (req, res) => {
  const db = await initializeDatabase();
  const folders = await db.all("SELECT id, name, parentId, orderIndex, type FROM folders ORDER BY orderIndex");
  res.json(folders);
});

app.get("/api/items", async (req, res) => {
  const db = await initializeDatabase();
  const items = await db.all("SELECT id, name, content, parentId, orderIndex, type FROM items ORDER BY orderIndex");
  res.json(items);
});

httpServer.listen(3001, () => {
  console.log("Server listening on *:3001");
});
