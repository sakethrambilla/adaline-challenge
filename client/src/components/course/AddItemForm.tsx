"use client";

import { Input } from "@/components/ui/input";
import { useStore } from "@/store";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { CourseContentItemType, CourseModuleType } from "@/types/course";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { NodeType } from "@/types";

interface AddItemFormProps {
  onClose: () => void;
  modules: CourseModuleType[];
}

export default function AddItemForm({ onClose, modules }: AddItemFormProps) {
  const [title, setTitle] = useState<string>("");
  const [isInFolder, setIsInFolder] = useState<boolean>(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { addItem } = useStore();

  const handleSubmit = () => {
    if (!title) {
      return;
    }

    addItem({
      name: title,
      type: NodeType.Item,
      orderIndex: 0,
      icon: "file",
      parentId: selectedFolderId || null,
    });

    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Topic title"
      />
      <div className="flex items-center gap-2">
        <Switch checked={isInFolder} onCheckedChange={setIsInFolder} />
        <span>Include in folder</span>
      </div>
      {isInFolder && (
        <Select
          value={selectedFolderId || ""}
          onValueChange={setSelectedFolderId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Add Topic</Button>
      </div>
    </div>
  );
}
