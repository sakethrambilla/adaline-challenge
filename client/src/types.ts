export type Item = {
  id: string;
  name: string;
  icon: string;
  folderId?: string | null;
  orderIndex: number;
};

export type Folder = {
  id: string;
  name: string;
  orderIndex: number;
  isOpen: boolean;
  items: Item[];
};

export type Node = Item | Folder;
