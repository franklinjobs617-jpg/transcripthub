import Image from "next/image";

type RealImageCardProps = {
  src: string;
  alt: string;
  title: string;
  description: string;
  accentClassName?: string;
};

export function RealImageCard({
  src,
  alt,
  title,
  description,
  accentClassName = "from-cyan-500/15 to-blue-500/10",
}: RealImageCardProps) {
  return (
    <article className="ui-card overflow-hidden bg-app-surface">
      <div className={`h-1.5 bg-gradient-to-r ${accentClassName}`} />
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-app-text sm:text-base">{title}</h3>
          <span className="rounded-md border border-app-border bg-app-bg px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-app-text-muted">
            Real Snapshot
          </span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-app-text-muted sm:text-sm">
          {description}
        </p>
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-bg">
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1000}
            className="h-auto w-full object-cover"
            priority={false}
          />
        </div>
      </div>
    </article>
  );
}
