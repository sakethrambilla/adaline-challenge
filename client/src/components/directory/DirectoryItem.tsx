import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { Edit, MoreVertical, Trash } from "lucide-react";
import { memo, useState } from "react";

import AddItemForm from "./AddItemForm";

interface DirectoryItemProps {
  item: any;
}

function DirectoryItem({ item }: DirectoryItemProps) {
  const { deleteItem } = useStore();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  function handleDeleteTopic() {
    deleteItem(item.id);
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded bg-muted p-2 text-muted-foreground"
      )}
    >
      <div className="gap-2 flex ">
        {item.icon && (
          <img
            src={item.icon}
            alt={item.name}
            className="h-6 w-6 rounded-full"
          />
        )}
        <p
          className={cn("cursor-pointer", item.courseModuleId ? "text-sm" : "")}
          onClick={() => setIsDialogOpen(true)}
        >
          {item.name}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger disabled={isDialogOpen}>
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex w-full gap-1">
          <DropdownMenuItem
            onClick={() => {
              setIsDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDeleteTopic}>
            <Trash className="h-4 w-4  " />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="pt-12">
          <AddItemForm
            item={item}
            onClose={() => {
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(DirectoryItem);
