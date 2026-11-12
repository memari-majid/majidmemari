const BIO_SECTIONS = [
  { title: "Teaching", text: "I teach practical AI through worked examples, interactive practice, and projects." },
  { title: "Applied AI", text: "My work spans machine learning, language models, agents, computer vision, and data governance." },
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
