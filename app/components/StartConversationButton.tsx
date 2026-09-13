"use client";

import type { ReactNode } from "react";
import { OPEN_CHAT_EVENT } from "@/app/components/ChatWidget";

/** Opens the site chat (consulting) from any CTA. */
export function StartConversationButton({
  children = "Start a conversation",
  className = "btn-primary",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
    >
      {children}
    </button>
  );
}
