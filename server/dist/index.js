"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const prisma = new client_1.PrismaClient();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === "production"
            ? "https://adaline-challenge.vercel.app"
            : "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? "https://adaline-challenge.vercel.app"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
}));
app.use(express_1.default.json());
function orderedNodes() {
    return __awaiter(this, void 0, void 0, function* () {
        const folders = yield prisma.folder.findMany({
            orderBy: { orderIndex: "asc" },
            include: { items: { orderBy: { orderIndex: "asc" } } },
        });
        const itemNodes = yield prisma.item.findMany({
            orderBy: { orderIndex: "asc" },
            where: { folderId: null },
        });
        const nodes = [
            ...folders.map((folder) => (Object.assign(Object.assign({}, folder), { type: "folder" }))),
            ...itemNodes.map((item) => (Object.assign(Object.assign({}, item), { type: "item" }))),
        ];
        const sortedNodes = nodes.sort((a, b) => a.orderIndex - b.orderIndex);
        return sortedNodes;
    });
}
function maxOrderIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        const maxItemOrderIndex = yield prisma.item.findFirst({
            orderBy: { orderIndex: "desc" },
        });
        const maxFolderOrderIndex = yield prisma.folder.findFirst({
            orderBy: { orderIndex: "desc" },
        });
        return Math.max((maxItemOrderIndex === null || maxItemOrderIndex === void 0 ? void 0 : maxItemOrderIndex.orderIndex) || 0, (maxFolderOrderIndex === null || maxFolderOrderIndex === void 0 ? void 0 : maxFolderOrderIndex.orderIndex) || 0);
    });
}
// Socket.IO logic
io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("requestInitialState", () => __awaiter(void 0, void 0, void 0, function* () {
        const allNodes = yield orderedNodes();
        socket.emit("stateUpdate", { nodes: allNodes });
        const folders = yield prisma.folder.findMany({
            orderBy: { orderIndex: "asc" },
        });
        socket.emit("folderUpdate", { folders: folders });
    }));
    socket.on("createItem", (itemData) => __awaiter(void 0, void 0, void 0, function* () {
        const maxItemOrderIndex = yield maxOrderIndex();
        yield prisma.item.create({
            data: {
                id: (0, uuid_1.v4)(),
                name: itemData.name,
                icon: itemData.icon,
                orderIndex: maxItemOrderIndex > itemData.orderIndex
                    ? itemData.orderIndex + 1
                    : maxItemOrderIndex,
                folderId: itemData.folderId || null,
            },
        });
        const allNodes = yield orderedNodes();
        // console.log("allNodes", allNodes);
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("createFolder", (folderData) => __awaiter(void 0, void 0, void 0, function* () {
        const maxFolderOrderIndex = yield maxOrderIndex();
        yield prisma.folder.create({
            data: {
                id: (0, uuid_1.v4)(),
                name: folderData.name,
                orderIndex: maxFolderOrderIndex > folderData.orderIndex
                    ? folderData.orderIndex + 1
                    : maxFolderOrderIndex,
                isOpen: true,
            },
        });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
        const folders = yield prisma.folder.findMany({
            orderBy: { orderIndex: "asc" },
        });
        io.emit("folderUpdate", { folders: folders });
    }));
    socket.on("updateItem", (itemData) => __awaiter(void 0, void 0, void 0, function* () {
        const oldItem = yield prisma.item.findUnique({
            where: { id: itemData.id },
        });
        var index = itemData.orderIndex;
        if (oldItem === null || oldItem === void 0 ? void 0 : oldItem.folderId) {
            if (itemData.folderId === null) {
                index = (yield maxOrderIndex()) + 1;
            }
            else {
                index = itemData.orderIndex;
            }
        }
        yield prisma.item.update({
            where: { id: itemData.id },
            data: {
                name: itemData.name,
                icon: itemData.icon,
                folderId: itemData.folderId || null,
                orderIndex: index,
            },
        });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("updateFolder", (folderData) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        yield prisma.folder.update({
            where: { id: folderData.id },
            data: {
                name: folderData.name,
                orderIndex: folderData.orderIndex,
                isOpen: (_a = folderData.is_open) !== null && _a !== void 0 ? _a : true,
            },
        });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("toggleFolder", (folderId) => __awaiter(void 0, void 0, void 0, function* () {
        // console.log("toggleFolder", folderId);
        const folder = yield prisma.folder.findUnique({
            where: { id: folderId },
        });
        if (!folder) {
            return;
        }
        yield prisma.folder.update({
            where: { id: folderId },
            data: { isOpen: !folder.isOpen },
        });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("reorderNode", (reorderData) => __awaiter(void 0, void 0, void 0, function* () {
        const { itemId, orderIndex, type } = reorderData;
        if (type === "item") {
            yield prisma.item.update({
                where: { id: itemId },
                data: { orderIndex },
            });
        }
        else if (type === "folder") {
            yield prisma.folder.update({
                where: { id: itemId },
                data: { orderIndex },
            });
        }
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("deleteFolder", (folderId) => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.item.deleteMany({ where: { folderId } });
        yield prisma.folder.delete({ where: { id: folderId } });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("deleteItem", (itemId) => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.item.delete({ where: { id: itemId } });
        const allNodes = yield orderedNodes();
        io.emit("stateUpdate", { nodes: allNodes });
    }));
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});
httpServer.listen(3001, () => {
    console.log("Server listening on *:3001");
});
