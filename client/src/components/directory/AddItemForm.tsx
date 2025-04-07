import { Input } from "@/components/ui/input";
import { useStore } from "@/store";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface AddItemFormProps {
  item?: any;
  onClose?: () => void;
}
export default function AddItemForm({ item, onClose }: AddItemFormProps) {
  console.log("item", item);
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [icon, setIcon] = useState<string>("");
  const [isInFolder, setIsInFolder] = useState<boolean>(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders } = useStore();
  console.log("folders", folders);

  const { addItem, updateItem } = useStore();

  const handleSubmit = () => {
    if (!name) {
      return;
    }
    setIsLoading(true);
    if (item) {
      updateItem({
        id: item.id,
        name,
        icon,
        orderIndex: item.orderIndex,
        folderId: selectedFolderId,
      });
    } else {
      addItem({ name, icon, folderId: selectedFolderId });
    }
    setIsLoading(false);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (item) {
      setName(item.name);
      setIcon(item.icon);
      if (item.folderId) {
        setSelectedFolderId(item.folderId);
        setIsInFolder(true);
      }
    }
  }, [item]);

  useEffect(() => {
    if (!isInFolder && selectedFolderId) {
      setSelectedFolderId(null);
    }
  }, [isInFolder]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder=" Item Name"
      />
      <Input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Item Icon URL"
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
            {folders.map((folder: any) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : item ? (
            "Update Item"
          ) : (
            "Add Item"
          )}
        </Button>
      </div>
    </div>
  );
}
