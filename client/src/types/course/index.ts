export type CourseContentItemType = {
  id: string;
  title: string;
  icon: string;
  order: number;
  type: "module" | "topic";
  topics?: CourseContentItemType[];
  courseModuleId?: string | null;
  accessType: boolean;
};
