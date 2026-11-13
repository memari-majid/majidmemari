import { handleResearchRequest } from "@/lib/research/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function GET(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return handleResearchRequest(request, (await context.params).action);
}
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return handleResearchRequest(request, (await context.params).action);
}
