import { PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Folder } from "lucide-react";
import CourseList from "./CourseList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useStore } from "@/store";
import AddItemForm from "./AddItemForm";

export default function DirectorySidebar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const { modules, addModule } = useStore();

  function handleAddTopic() {
    setIsDialogOpen(true);
  }

  function handleAddModule() {
    setIsModuleDialogOpen(true);
  }

  function handleCreateModule() {
    if (!moduleTitle) return;
    addModule({
      title: moduleTitle,
      description: moduleDescription,
    });
    setModuleTitle("");
    setModuleDescription("");
    setIsModuleDialogOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full max-w-80 flex-col gap-3 rounded-lg border border-primary p-4">
      <h1 className="text-xl">Course Overview</h1>

      <Separator className="w-full" />

      <div className="flex items-center justify-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              onClick={handleAddTopic}
              className="cursor-pointer rounded-md bg-secondary p-2 text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <PlusIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Add a new topic</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={handleAddModule}
              className="cursor-pointer rounded-md bg-secondary p-2 text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <Folder className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Add a new module</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Separator className="w-full" />

      <CourseList />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new topic</DialogTitle>
          </DialogHeader>
          <AddItemForm
            onClose={() => setIsDialogOpen(false)}
            modules={modules}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new module</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Module title"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="rounded-md border p-2"
            />
            <textarea
              placeholder="Module description (optional)"
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              className="rounded-md border p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModuleDialogOpen(false)}
                className="rounded-md bg-outline p-2 text-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateModule}
                className="rounded-md bg-primary p-2 text-primary-foreground"
              >
                Create Module
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
