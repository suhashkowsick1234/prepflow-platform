import React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
  iconOnly?: boolean;
}

export function AppLogo({
  size = 40,
  showText = true,
  className,
  textClassName,
  iconOnly = false,
}: AppLogoProps) {
  const displayShowText = showText && !iconOnly;

  return (
    <div className={cn("inline-flex items-center gap-3 select-none group", className)}>
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className="relative shrink-0 rounded-xl overflow-hidden shadow-md shadow-purple-950/20 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105"
      >
        <img
          src="/logo.png"
          alt="PrepFlow AI Logo"
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-center rounded-xl"
        />
      </div>

      {displayShowText && (
        <span
          className={cn(
            "font-extrabold tracking-tight text-foreground flex items-center gap-1.5",
            size >= 40 ? "text-xl" : "text-lg",
            textClassName
          )}
        >
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
            PrepFlow
          </span>
          <span className="bg-purple-600/90 text-white text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm">
            AI
          </span>
        </span>
      )}
    </div>
  );
}

export default AppLogo;
