import { createCourseChatHandler } from "@/lib/course-kb/chat";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = createCourseChatHandler();
