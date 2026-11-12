import { readCourseRequest, CourseRequestError } from "@/lib/course-kb/validation";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createCourseAccess } from "@/lib/course-kb/access";
import { courseClientKey } from "@/lib/course-kb/access";
const access = createCourseAccess();
const ready = () => Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.RESEND_FROM_EMAIL);
export async function GET() { return NextResponse.json({ available: ready() }, { headers: { "Cache-Control": "no-store" } }); }
export async function POST(request: Request) {
  if(request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({error:"Send your inquiry from this website."},{status:403});
  if(!ready()) return NextResponse.json({error:"Inquiry delivery is unavailable. Your message has not been sent. Please try again later."},{status:503});
  const release = access.acquire(courseClientKey(request));
  if(!release) return NextResponse.json({error:"Please wait before sending another inquiry."},{status:429});
  try {
    if(Number(request.headers.get("content-length") ?? 0)>20000) return NextResponse.json({error:"The inquiry is too long."},{status:413});
    const body=await readCourseRequest(request) as {name?: unknown; email?: unknown; message?: unknown; website?: unknown};
    if (!body || typeof body !== "object") return NextResponse.json({error:"Enter a valid inquiry."},{status:400}); const name=typeof body.name === "string" ? body.name.trim() : ""; const email=typeof body.email === "string" ? body.email.trim() : ""; const message=typeof body.message === "string" ? body.message.trim() : "";
    if(body.website || !name || name.length>120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || message.length<10 || message.length>4000) return NextResponse.json({error:"Enter your name, a valid reply address, and a message of 10–4,000 characters."},{status:400});
    const resend=new Resend(process.env.RESEND_API_KEY!);
    const {error}=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL!,to:[process.env.CONTACT_TO_EMAIL!],replyTo:email,subject:`[Website inquiry] ${name.replace(/[\r\n]/g," ")}`,text:`From: ${name} <${email}>\nSource: Website inquiry form\n\n${message}`});
    if(error) return NextResponse.json({error:"Your inquiry was not delivered. Please try again later."},{status:502});
    return NextResponse.json({ok:true});
  } catch (error) { return NextResponse.json({error:"Your inquiry could not be sent. Please try again later."},{status:error instanceof CourseRequestError ? error.status : 400}); } finally { release(); }
}
