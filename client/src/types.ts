import { z } from "zod";

export enum NodeType {
  Folder = "folder",
  Item = "item",
}

export const NodeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(NodeType),
  parentId: z.string().nullable(),
  orderIndex: z.number(),
  icon: z.string().optional(),
});

export type Node = z.infer<typeof NodeSchema>;

export type Folder = Node & {
  type: "folder";
};

export type Item = Node & {
  type: "item";
  content: string;
};

export type DraggableItem = Item | Folder;
