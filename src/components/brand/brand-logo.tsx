import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  /** lockup = monogramme + Coin229 ; mark = icône APK C2 ; wordmark = texte seul */
  variant?: "lockup" | "mark" | "wordmark";
  className?: string;
  /** Hauteur approximative en px (largeur auto) */
  height?: number;
  priority?: boolean;
  /** Sur fond sombre */
  onDark?: boolean;
};

/** Même fichier que le manifeste PWA / icône d’installation APK. */
export const BRAND_APP_ICON = "/icons/icon-192.png";

/**
 * Identité Coin229 — Deep Green × Gold, monogramme C2 de l’APK.
 */
export function BrandLogo({
  variant = "lockup",
  className,
  height = 36,
  priority = false,
  onDark = false,
}: Props) {
  if (variant === "mark") {
    return (
      <Image
        src={BRAND_APP_ICON}
        alt="Coin229"
        width={height}
        height={height}
        className={cn("shrink-0 rounded-[22%] object-cover", className)}
        style={{ width: height, height }}
        priority={priority}
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          onDark ? "text-white" : "text-navy",
          className
        )}
        style={{ fontSize: height * 0.55 }}
      >
        Coin<span className="text-amber">229</span>
      </span>
    );
  }

  const w = Math.round(height * 3.6);
  return (
    <Image
      src={onDark ? "/brand/logo-on-dark.png" : "/brand/logo-lockup.png"}
      alt="Coin229 — Accessoires. Style. Confiance."
      width={w}
      height={height}
      className={cn("h-auto w-auto shrink-0 object-contain", className)}
      style={{ height, width: "auto", maxWidth: w }}
      priority={priority}
    />
  );
}
