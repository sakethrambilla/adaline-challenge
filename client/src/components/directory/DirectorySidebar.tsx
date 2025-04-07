import { PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import AddItemForm from "./AddItemForm";
import DirectoryList from "./DirectoryList";
import AddFolderForm from "./AddFolderForm";

export default function DirectorySidebar() {
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full max-w-80 flex-col gap-3 rounded-lg border border-primary p-4">
      <h1 className="text-xl">Directory</h1>

      <Separator className="w-full" />

      <div className="flex items-center justify-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              onClick={() => setIsItemDialogOpen(true)}
              className="cursor-pointer rounded-md bg-secondary p-2 text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <PlusIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Add a new item</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => setIsFolderDialogOpen(true)}
              className="cursor-pointer rounded-md bg-secondary p-2 text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <Folder className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Add a new folder</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Separator className="w-full" />
      <DirectoryList />

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new item</DialogTitle>
          </DialogHeader>
          <AddItemForm
            onClose={() => {
              setIsItemDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new Folder</DialogTitle>
          </DialogHeader>
          <AddFolderForm
            onClose={() => {
              setIsFolderDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
