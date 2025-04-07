export type CourseContentItemType = {
  id: string;
  title: string;
  type: "topic" | "module";
  order: number;
  courseModuleId: string | null;
  icon?: string;
  accessType?: boolean;
};

export type CourseModuleType = {
  id: string;
  title: string;
  description?: string;
  isOpen: boolean;
  order: number;
  topics: CourseContentItemType[];
};
