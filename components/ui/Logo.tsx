import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  /** Version réduite (en-tête au défilement, menu mobile) */
  compact?: boolean;
  tone?: "dark" | "light";
};

/** Logo horizontal : emblème « H + diamant » à gauche, « HADDAJ / BIJOUTERIE » à droite. */
export function Logo({ className, compact = false, tone = "dark" }: LogoProps) {
  return (
    <span className={cn("inline-flex select-none items-center gap-2.5", className)}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={382}
        height={264}
        priority
        className={cn("h-auto transition-all duration-500 ease-luxe", compact ? "w-[46px]" : "w-[46px] lg:w-[58px]", tone === "light" && "invert")}
      />
      <span className={cn("flex flex-col leading-none", tone === "dark" ? "text-bordeaux-900" : "text-white")}>
        <span className={cn("font-serif tracking-[0.28em] transition-all duration-500", compact ? "text-[18px]" : "text-[18px] lg:text-[21px]")}>HADDAJ</span>
        <span className="mt-1 text-[8.5px] font-medium tracking-[0.5em] opacity-70">BIJOUTERIE</span>
      </span>
    </span>
  );
}

/** Logo complet (empilé), pour le pied de page, la connexion et l'admin. */
export function LogoFull({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Image
      src={tone === "dark" ? "/logo.png" : "/logo-light.png"}
      alt="Haddaj Bijouterie"
      width={469}
      height={439}
      className={cn("h-auto w-[140px]", className)}
    />
  );
}
