import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Node, Folder, Item } from "./types";

const socket = io("http://localhost:3001");

interface StoreState {
  nodes: Node[];
  folders: Folder[];
  addFolder: (folder: Omit<Folder, "id" | "type">) => void;
  addItem: (item: Omit<Item, "id" | "type">) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  reorderNodes: (nodes: Node[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      nodes: [],
      folders: [],

      addFolder: (folder) =>
        set((state) => {
          const newFolder: Folder = {
            ...folder,
            id: crypto.randomUUID(),
            type: "folder",
          };
          socket.emit("createFolder", newFolder);
          return { nodes: [...state.nodes, newFolder] };
        }),
      addItem: (item) =>
        set((state) => {
          const newItem: Item = {
            ...item,
            id: crypto.randomUUID(),
            type: "item",
          };
          socket.emit("createItem", newItem);
          return { nodes: [...state.nodes, newItem] };
        }),

      updateNode: (id, updates) =>
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (!node) return state;

          const updatedNode = { ...node, ...updates };
          if (node.type === "folder") {
            socket.emit("updateFolder", updatedNode);
          } else {
            socket.emit("updateItem", updatedNode);
          }

          const newNodes = state.nodes.map((n) =>
            n.id === id ? updatedNode : n
          );
          return { nodes: newNodes };
        }),
      deleteNode: (id) =>
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (!node) return state;

          if (node.type === "folder") {
            socket.emit("deleteFolder", id);
          } else {
            socket.emit("deleteItem", id);
          }

          const newNodes = state.nodes.filter((n) => n.id !== id);
          return { nodes: newNodes };
        }),
      reorderNodes: (nodes) =>
        set((state) => {
          const updatedNodes = nodes.map((node, index) => ({
            ...node,
            orderIndex: index,
          }));

          // Emit updates for each node
          updatedNodes.forEach((node) => {
            if (node.type === "folder") {
              socket.emit("updateFolder", node);
            } else {
              socket.emit("updateItem", node);
            }
          });

          return { nodes: updatedNodes };
        }),
    }),
    {
      name: "node-manager-storage",
    }
  )
);

// Listen for state updates from the server
socket.on("stateUpdate", (state) => {
  useStore.setState({ nodes: state.nodes });
});

// Request initial state when connected
socket.on("connect", () => {
  socket.emit("requestInitialState");
});
