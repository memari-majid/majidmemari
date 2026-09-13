import type { ReactNode } from "react";
import { MAJID } from "@/lib/majid";

const UVU_URL = "https://www.uvu.edu/";
const ONE_U_RAI_URL = "https://rai.utah.edu/";

/**
 * Named collaborators only. No client counts. No mixed brand logos —
 * every card uses the same mark + type treatment.
 * Silicon Slopes is community, not a client. PacifiCorp is GridEye collaboration, not a client.
 */
export function PartnersStrip({
  voice = "I",
  includeSchoolOfEducation = true,
}: {
  voice?: "we" | "I";
  includeSchoolOfEducation?: boolean;
}) {
  const heading = voice === "we" ? "Who we work with" : "Who I work with";

  return (
    <section
      id="partners"
      className="scroll-mt-20 border-t border-zinc-200/80 bg-white px-4 py-24 dark:border-zinc-800/40 dark:bg-zinc-950 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Partners
        </p>
        <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          State institutes and agencies, Utah campuses, Utah&apos;s Silicon Slopes tech community,
          and industry consulting — named collaborators, not a client count.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PartnerColumn facet="State" mark="state">
            <PartnerName>Gary R. Herbert Institute for Public Policy</PartnerName>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              DataGovAI and privacy-preserving public-sector AI.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              <li>Utah Office of Data Privacy</li>
              <li>Utah Department of Health and Human Services</li>
            </ul>
          </PartnerColumn>

          <PartnerColumn facet="Universities" mark="universities">
            <PartnerName>
              <a href={UVU_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                {MAJID.university}
              </a>
            </PartnerName>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Academic home
              {includeSchoolOfEducation ? " · UVU School of Education (AI-ClassSims)" : ""}.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              <a href={ONE_U_RAI_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                University of Utah One-U RAI
              </a>
              {" — "}
              public and policy conversations.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              GridEye: University of Utah / UVU ECE / PacifiCorp collaboration; USHE proposal in
              development.
            </p>
          </PartnerColumn>

          <PartnerColumn facet="Silicon Slopes" mark="community">
            <PartnerName>
              <a href={MAJID.siliconSlopes} target="_blank" rel="noopener noreferrer" className="text-link">
                Utah&apos;s Silicon Slopes tech community
              </a>
            </PartnerName>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              A 501(c)(3) community — not an employer or client.
            </p>
          </PartnerColumn>

          <PartnerColumn facet="Industry" mark="industry">
            <PartnerName>{MAJID.clarion}</PartnerName>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Applied AI consulting on LLM and agent workflows — including when to use AI.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              <a
                href={MAJID.nvidiaInstructorDirectory}
                target="_blank"
                rel="me noopener noreferrer"
                className="text-link"
              >
                NVIDIA Certified Instructor Directory
              </a>
              {" — "}
              Deep Learning Institute listing. Instructional certification, not a client.
            </p>
          </PartnerColumn>
        </div>
      </div>
    </section>
  );
}

function PartnerColumn({
  facet,
  mark,
  children,
}: {
  facet: string;
  mark: "state" | "universities" | "community" | "industry";
  children: ReactNode;
}) {
  return (
    <div className="card flex h-full flex-col p-6">
      <PartnerMark kind={mark} />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {facet}
      </p>
      <div className="mt-2 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function PartnerName({ children }: { children: ReactNode }) {
  return <p className="text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">{children}</p>;
}

function PartnerMark({ kind }: { kind: "state" | "universities" | "community" | "industry" }) {
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {MARKS[kind]}
    </span>
  );
}

const MARKS: Record<"state" | "universities" | "community" | "industry", ReactNode> = {
  state: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 21V8.25L12 3.75l7.5 4.5V21M8.25 21v-6h7.5v6"
      />
    </svg>
  ),
  universities: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
      />
    </svg>
  ),
  community: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 5.5-8 4 5 3-4L21 17H3Z" />
    </svg>
  ),
  industry: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 7.5V6A2.25 2.25 0 0 1 9 3.75h6A2.25 2.25 0 0 1 17.25 6v1.5M3.75 9.75h16.5v8.25A2.25 2.25 0 0 1 18 20.25H6a2.25 2.25 0 0 1-2.25-2.25V9.75Z"
      />
    </svg>
  ),
};
