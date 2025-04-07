import { Input } from "@/components/ui/input";
import { useStore } from "@/store";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface AddFolderFormProps {
  folder?: any;
  onClose?: () => void;
}
export default function AddFolderForm({ folder, onClose }: AddFolderFormProps) {
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { addFolder, updateFolder } = useStore();

  const handleSubmit = () => {
    if (!name) {
      return;
    }
    setIsLoading(true);
    if (folder) {
      updateFolder({
        id: folder.id,
        name,
        orderIndex: folder.orderIndex,
        isOpen: folder.isOpen,
        items: folder.items,
      });
    } else {
      addFolder({ name });
    }
    setIsLoading(false);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (folder) {
      setName(folder.name);
    }
  }, [folder]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Folder Name"
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : folder ? (
            "Update Folder"
          ) : (
            "Add Folder"
          )}
        </Button>
      </div>
    </div>
  );
}
