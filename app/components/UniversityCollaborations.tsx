import Image from "next/image";
import { UNIVERSITY_COLLABORATIONS } from "@/lib/universities";

export function UniversityCollaborations() {
  return (
    <section id="university-collaborations" aria-labelledby="university-collaborations-heading" className="mt-10 scroll-mt-28 border-t border-slate-200 pt-8">
      <h2 id="university-collaborations-heading" className="text-xl font-semibold">University collaborations</h2>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {UNIVERSITY_COLLABORATIONS.map((university) => (
          <li key={university.name} className="w-full min-w-0 min-[480px]:w-[calc(50%_-_0.75rem)] md:w-[calc(33.333%_-_1rem)]">
            <a href={university.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`${university.name} (opens in a new tab)`} className="flex h-36 items-center justify-center rounded-lg bg-white px-2 py-2">
              <Image src={university.logo} alt={university.name} width={university.width} height={university.height} unoptimized={university.logo.endsWith(".svg")} sizes="224px" style={{ width: university.displayWidth, height: "auto" }} className="max-w-full object-contain" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
