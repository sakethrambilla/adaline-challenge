import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

async function orderedNodes() {
  const folders = await prisma.folder.findMany({
    orderBy: { orderIndex: "asc" },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });

  const itemNodes = await prisma.item.findMany({
    orderBy: { orderIndex: "asc" },
    where: { folderId: null },
  });

  const nodes = [
    ...folders.map((folder) => ({
      ...folder,
      type: "folder",
    })),
    ...itemNodes.map((item) => ({
      ...item,
      type: "item",
    })),
  ];
  console.log("nodes", nodes);

  const sortedNodes = nodes.sort((a, b) => a.orderIndex - b.orderIndex);
  console.log("sortedNodes", sortedNodes);

  return sortedNodes;
}

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("requestInitialState", async () => {
    const allNodes = await orderedNodes();
    socket.emit("initialState", { nodes: allNodes });
  });

  socket.on("createFolder", async (folderData) => {
    await prisma.folder.create({
      data: {
        id: uuidv4(),
        name: folderData.name,
        orderIndex: folderData.orderIndex,
        isOpen: true,
      },
    });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("createItem", async (itemData) => {
    console.log(itemData);
    await prisma.item.create({
      data: {
        id: uuidv4(),
        name: itemData.name,
        icon: itemData.icon,
        orderIndex: 0,
        folderId: itemData.parentId || null,
      },
    });
    const allNodes = await orderedNodes();
    console.log("allNodes", allNodes);
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("updateFolder", async (folderData) => {
    await prisma.folder.update({
      where: { id: folderData.id },
      data: {
        name: folderData.name,
        orderIndex: folderData.orderIndex,
        isOpen: folderData.is_open ?? true,
      },
    });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("updateItem", async (itemData) => {
    await prisma.item.update({
      where: { id: itemData.id },
      data: {
        name: itemData.name,
        icon: itemData.icon,
        folderId: itemData.parentId || null,
        orderIndex: itemData.orderIndex,
      },
    });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("deleteFolder", async (folderId) => {
    await prisma.item.deleteMany({ where: { folderId } });
    await prisma.folder.delete({ where: { id: folderId } });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("deleteItem", async (itemId) => {
    await prisma.item.delete({ where: { id: itemId } });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// REST API endpoints
app.get("/api/nodes", async (req, res) => {
  const allNodes = await orderedNodes();
  res.json(allNodes);
});

app.get("/api/folders", async (req, res) => {
  const folders = await prisma.folder.findMany({
    orderBy: { orderIndex: "asc" },
  });
  res.json(folders);
});

app.get("/api/items", async (req, res) => {
  const items = await prisma.item.findMany({
    orderBy: { orderIndex: "asc" },
  });
  res.json(items);
});

httpServer.listen(3001, () => {
  console.log("Server listening on *:3001");
});
