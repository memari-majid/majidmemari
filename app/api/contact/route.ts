import { NextResponse } from "next/server";
import { EMAIL_RE, founderInbox, isEmailConfigured, sendEmail } from "@/lib/email";
import { classifyInquiry, fallbackInquiryResponse, type InquiryCategory } from "@/lib/inquiry-ai";

/** Smaller / cheaper model for classification (override with CONTACT_CLASSIFY_MODEL).
 *  Routed through Vercel AI Gateway; use a `provider/model` slug. */
const CLASSIFY_MODEL = process.env.CONTACT_CLASSIFY_MODEL ?? "openai/gpt-oss-20b";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const source = typeof body.source === "string" ? body.source : "contact-form";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    let category: InquiryCategory = "general";
    let autoReply = fallbackInquiryResponse().autoReply;

    try {
      const classified = await classifyInquiry({
        name,
        message,
        modelId: CLASSIFY_MODEL,
      });
      category = classified.category;
      autoReply = classified.autoReply;
    } catch (err) {
      console.error("[contact] classifyInquiry:", err);
      const fb = fallbackInquiryResponse();
      category = fb.category;
      autoReply = fb.autoReply;
    }

    // One delivery path for the whole site (`lib/email.ts`). Not configured:
    // the message is logged server-side and `dev: true` tells the form so.
    const sent = await sendEmail({
      to: founderInbox(),
      replyTo: email,
      subject: `[majidmemari.com] [${category}] Message from ${name}`,
      text: `From: ${name} <${email}>\nSource: ${source}\nAI category: ${category}\n\n${message}`,
    });
    if (!sent.ok) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      dev: !isEmailConfigured(),
      delivered: sent.delivered,
      category,
      autoReply,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
