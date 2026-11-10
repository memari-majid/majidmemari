export type CourseChunk = {
  id: string;
  page: string;
  title: string;
  section: string;
  url: string;
  body: string;
};

export type CourseSource = {
  sourceId: string;
  title: string;
  url: string;
};

export type CourseTurn = { role: "user" | "assistant"; content: string };
