import { ChatWidget } from "@/app/components/ChatWidget";
import { HomePageContent } from "@/app/components/HomePageContent";
import { JsonLd } from "@/app/components/JsonLd";
import { LegacyHomeAnchor } from "@/app/components/LegacyHomeAnchor";
import { NavBar } from "@/app/components/NavBar";

export default function HomePage() {
  return (
    <div className="flex min-h-svh min-w-0 flex-col overflow-x-hidden bg-zinc-50 text-zinc-900">
      <JsonLd />
      <NavBar />
      <LegacyHomeAnchor />
      <HomePageContent />
      <ChatWidget />
    </div>
  );
}
