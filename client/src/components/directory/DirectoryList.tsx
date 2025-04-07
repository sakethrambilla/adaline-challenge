import { useStore } from "@/store";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { memo, useEffect, useState } from "react";
import DirectoryListItem from "./DirectoryListItem";
import { Node } from "@/types";
function DirectoryList() {
  const { nodes, reorderNode } = useStore();

  // State to manage the order of directory items
  const [nodesList, setNodesList] = useState<Node[]>(nodes);

  // Function to handle reordering of directory items
  function handleReorder(item: any, order: number) {
    console.log("Reordering item", item, order);
    // Update the order of modules and topics based on their type
    if (item.type === "item") {
      reorderNode(item.id, order, "item");
    } else if (item.type === "folder") {
      reorderNode(item.id, order, "folder");
    }
  }

  // Handle the end of a drag event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if the dragged item is dropped over a different item
    if (over && active.id !== over.id) {
      const oldIndex = nodesList.findIndex((item) => item.id === active.id);
      const newIndex = nodesList.findIndex((item) => item.id === over.id);
      // console.log("Drag End");

      // Move the item in the array
      const newArray = arrayMove(nodesList, oldIndex, newIndex);

      // Update the order of items if necessary
      newArray.map((item, index) => {
        if (item.orderIndex !== index) {
          handleReorder(item, index);
        }
      });

      // Update the state with the new order
      setNodesList(newArray);
    }
  };

  // Effect to reset the directory list when props change
  useEffect(() => {
    setNodesList(nodes);
  }, [nodes]);

  // Render the drag-and-drop context and sortable items
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2">
        <SortableContext items={nodesList.map((item) => item.id)}>
          {nodesList.map((item, index) => (
            <DirectoryListItem key={index} item={item} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

export default memo(DirectoryList);
