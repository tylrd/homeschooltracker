"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LandingScreenshot() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const src = isDark ? "/screenshot-dark.png" : "/screenshot.png";
  const alt = isDark
    ? "Homeschool Keeper dashboard preview in dark mode"
    : "Homeschool Keeper dashboard preview";
  const width = isDark ? 2194 : 2148;
  const height = isDark ? 1068 : 1160;

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      className="block h-auto w-full object-cover"
    />
  );
}
