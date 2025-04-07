import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip } from "lucide-react";
import { memo } from "react";
import DirectoryItem from "./DirectoryItem";
import DirectoryFolder from "./DirectoryFolder";

function DirectoryListItem({ item }: { item: any }) {
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
      {item.type === "folder" ? (
        <DirectoryFolder item={item} />
      ) : (
        <DirectoryItem key={item.id} item={item} />
      )}
    </div>
  );
}

export default memo(DirectoryListItem);
