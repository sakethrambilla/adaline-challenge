import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Folder, Item, Node } from "./types";

const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:3001");

interface StoreState {
  nodes: Node[];
  folders: Folder[];
  addItem: ({
    name,
    icon,
    folderId,
  }: {
    name: string;
    icon: string;
    folderId: string | null;
  }) => void;
  addFolder: ({ name }: { name: string }) => void;
  updateItem: (item: Item) => void;
  updateFolder: (folder: Folder) => void;
  deleteItem: (itemId: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  reorderNode: (
    itemId: string,
    orderIndex: number,
    type: "item" | "folder"
  ) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (_) => ({
      nodes: [],
      folders: [],
      addItem: (item) => socket.emit("createItem", item),
      addFolder: (folder) => socket.emit("createFolder", folder),
      deleteItem: (itemId) => socket.emit("deleteItem", itemId),
      deleteFolder: (folderId) => socket.emit("deleteFolder", folderId),
      updateItem: (item) => socket.emit("updateItem", item),
      updateFolder: (folder) => socket.emit("updateFolder", folder),
      reorderNode: (itemId, orderIndex, type) =>
        socket.emit("reorderNode", { itemId, orderIndex, type }),
      toggleFolder: (folderId) => socket.emit("toggleFolder", folderId),
    }),
    {
      name: "node-manager-storage",
    }
  )
);

// Listen for state updates from the server
socket.on("stateUpdate", (state) => {
  console.log("state", state);
  useStore.setState({ nodes: state.nodes });
});

// Listen for folder updates from the server
socket.on("folderUpdate", (state) => {
  console.log("folderUpdate", state);
  useStore.setState({ folders: state.folders });
});

// Request initial state when connected
socket.on("connect", () => {
  socket.emit("requestInitialState");
});
