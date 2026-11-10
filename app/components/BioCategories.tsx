import { MAJID } from "@/lib/majid";

const BIO_SECTIONS = [
  { title: "Teaching", text: MAJID.bio.academia },
  { title: "Applied AI", text: MAJID.bio.industry },
  { title: "Mentorship & collaboration", text: MAJID.bio.community },
];

export function BioCategories({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`}>
      {BIO_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
          <p className="mt-3 leading-relaxed text-slate-600">{section.text}</p>
        </section>
      ))}
    </div>
  );
}
