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
    origin:
      process.env.NODE_ENV === "production"
        ? "https://adaline-challenge.vercel.app"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://adaline-challenge.vercel.app"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
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

  const sortedNodes = nodes.sort((a, b) => a.orderIndex - b.orderIndex);

  return sortedNodes;
}

async function maxOrderIndex() {
  const maxItemOrderIndex = await prisma.item.findFirst({
    orderBy: { orderIndex: "desc" },
  });
  const maxFolderOrderIndex = await prisma.folder.findFirst({
    orderBy: { orderIndex: "desc" },
  });
  return Math.max(
    maxItemOrderIndex?.orderIndex || 0,
    maxFolderOrderIndex?.orderIndex || 0
  );
}

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("requestInitialState", async () => {
    const allNodes = await orderedNodes();
    socket.emit("stateUpdate", { nodes: allNodes });
    const folders = await prisma.folder.findMany({
      orderBy: { orderIndex: "asc" },
    });
    socket.emit("folderUpdate", { folders: folders });
  });

  socket.on("createItem", async (itemData) => {
    const maxItemOrderIndex = await maxOrderIndex();
    await prisma.item.create({
      data: {
        id: uuidv4(),
        name: itemData.name,
        icon: itemData.icon,
        orderIndex:
          maxItemOrderIndex > itemData.orderIndex
            ? itemData.orderIndex + 1
            : maxItemOrderIndex,
        folderId: itemData.folderId || null,
      },
    });
    const allNodes = await orderedNodes();
    // console.log("allNodes", allNodes);
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("createFolder", async (folderData) => {
    const maxFolderOrderIndex = await maxOrderIndex();
    await prisma.folder.create({
      data: {
        id: uuidv4(),
        name: folderData.name,
        orderIndex:
          maxFolderOrderIndex > folderData.orderIndex
            ? folderData.orderIndex + 1
            : maxFolderOrderIndex,
        isOpen: true,
      },
    });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
    const folders = await prisma.folder.findMany({
      orderBy: { orderIndex: "asc" },
    });
    io.emit("folderUpdate", { folders: folders });
  });

  socket.on("updateItem", async (itemData) => {
    const oldItem = await prisma.item.findUnique({
      where: { id: itemData.id },
    });
    var index = itemData.orderIndex;
    if (oldItem?.folderId) {
      if (itemData.folderId === null) {
        index = (await maxOrderIndex()) + 1;
      } else {
        index = itemData.orderIndex;
      }
    }

    await prisma.item.update({
      where: { id: itemData.id },
      data: {
        name: itemData.name,
        icon: itemData.icon,
        folderId: itemData.folderId || null,
        orderIndex: index,
      },
    });
    const allNodes = await orderedNodes();
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

  socket.on("toggleFolder", async (folderId) => {
    // console.log("toggleFolder", folderId);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      return;
    }
    await prisma.folder.update({
      where: { id: folderId },
      data: { isOpen: !folder.isOpen },
    });
    const allNodes = await orderedNodes();
    io.emit("stateUpdate", { nodes: allNodes });
  });

  socket.on("reorderNode", async (reorderData) => {
    const { itemId, orderIndex, type } = reorderData;
    if (type === "item") {
      await prisma.item.update({
        where: { id: itemId },
        data: { orderIndex },
      });
    } else if (type === "folder") {
      await prisma.folder.update({
        where: { id: itemId },
        data: { orderIndex },
      });
    }

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

httpServer.listen(3001, () => {
  console.log("Server listening on *:3001");
});
