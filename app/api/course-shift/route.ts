import { createShiftClassifierHandler } from "@/lib/course-kb/shift-classifier";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = createShiftClassifierHandler();
