import Image from "next/image";

type LogoItem = { name: string; src: string };

type Variant = "mono" | "color";

/*
 * One ink for every mark, in both themes. The source files are a mix: most are
 * single-path black, AWS ships its two brand colours, so left alone the light
 * theme showed one navy and orange logo in a row of black ones and every mark
 * read as heavy pure black on white. `brightness-0` flattens any source colour
 * to black, the opacity softens it to the zinc the rest of the page uses, and
 * the dark theme inverts the same flattened mark to white.
 */
const imgMono =
  "h-10 w-auto max-h-10 max-w-full object-contain brightness-0 opacity-65 transition hover:opacity-90 motion-reduce:transition-none sm:h-12 sm:max-h-12 dark:brightness-0 dark:invert dark:opacity-70 dark:hover:opacity-100";

const imgColor =
  "h-10 w-auto max-h-10 max-w-full object-contain opacity-90 transition hover:opacity-100 sm:h-12 sm:max-h-12 dark:opacity-95 dark:hover:opacity-100";

export function LogoStrip({
  items,
  className = "",
  variant = "mono",
}: {
  items: LogoItem[];
  className?: string;
  variant?: Variant;
}) {
  const imgClass = variant === "color" ? imgColor : imgMono;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-10 sm:gap-x-10 ${className}`}>
      {items.map((item) => (
        <div
          key={item.name}
          className="flex min-h-[52px] min-w-0 max-w-[min(100%,220px)] flex-1 items-center justify-center px-2 sm:min-h-[60px] sm:min-w-[120px] sm:px-3"
          title={item.name}
        >
          <Image
            src={item.src}
            alt={`${item.name} logo`}
            width={220}
            height={64}
            sizes="(max-width: 640px) 40vw, 180px"
            className={imgClass}
          />
        </div>
      ))}
    </div>
  );
}
