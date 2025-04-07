import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Folder, FolderOpen, Grip, MoreVertical } from "lucide-react";
import { memo, useEffect, useState } from "react";
import DirectoryItem from "./DirectoryItem";
import { useStore } from "@/store";
import { Folder as FolderType, Item } from "@/types";
import AddFolderForm from "./AddFolderForm";

interface DirectoryFolderProps {
  item: FolderType;
}

function DirectoryFolder({ item }: DirectoryFolderProps) {
  const { toggleFolder, reorderNode } = useStore();

  const [folderDialogOpen, setFolderDialogOpen] = useState<boolean>(false);
  const [isCollapseOpen, setIsCollapseOpen] = useState<boolean>(item.isOpen);
  const [itemList, setItemList] = useState<Item[]>(item.items);

  function handleReorder(item: any, order: number, folderId: string) {
    console.log("Reorder Item", item, order, folderId);
    reorderNode(item.id, order, "item");
  }

  // Handle the end of a drag event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if the dragged item is dropped over a different item
    if (over && active.id !== over.id) {
      // console.log("Drag End 2");
      const oldIndex = itemList.findIndex(
        (item: Item) => item.id === active.id
      );
      const newIndex = itemList.findIndex((item: Item) => item.id === over.id);
      // console.log("Drag End");

      // Move the item in the array
      const newArray = arrayMove(itemList, oldIndex, newIndex);

      // Update the order of items if necessary
      newArray.map((item: any, index: number) => {
        if (item.orderIndex !== index && item.folderId) {
          handleReorder(item, index, item.courseModuleId);
        }
      });

      // Update the state with the new order
      setItemList(newArray);
    }
  };

  useEffect(() => {
    setItemList(item.items || []);
  }, [item]);

  useEffect(() => {
    setIsCollapseOpen(item?.isOpen || false);
  }, [item]);
  return (
    <>
      <Collapsible
        key={item.id}
        open={isCollapseOpen}
        onOpenChange={() => {
          setIsCollapseOpen(!isCollapseOpen);
          toggleFolder(item.id);
        }}
        className="h-full w-full"
      >
        <div className="flex w-full items-center gap-2 rounded bg-secondary p-2 text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground">
          <CollapsibleTrigger className="flex w-full items-center gap-2">
            {isCollapseOpen ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            <p>{item.name}</p>
          </CollapsibleTrigger>
          <MoreVertical
            className="h-4 w-4"
            onClick={() => setFolderDialogOpen(true)}
          />
        </div>
        <CollapsibleContent
          className={cn(
            "flex-col gap-2 pl-2",
            item.items?.length === 0 ? "hidden" : "flex",
            isCollapseOpen ? "py-2" : "py-0"
          )}
        >
          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-2">
              <SortableContext items={itemList}>
                {itemList.map((item: Item, index: number) => (
                  <DirectoryFolderTopicList item={item} key={index} />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="pt-12">
          <AddFolderForm
            folder={item}
            onClose={() => setFolderDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(DirectoryFolder);

function DirectoryFolderTopicList({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transition, transform } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <div className="cursor-grab p-2" {...attributes} {...listeners}>
        <Grip className="h-4 w-4" />
      </div>
      <DirectoryItem item={item} />
    </div>
  );
}
