"use client";

import { ArrowDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta > 0) {
        // Apply resistance — distance grows slower as you pull further
        setPullDistance(Math.min(delta * 0.4, 120));
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    },
    [refreshing],
  );

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      router.refresh();
      // Give the server components time to re-render
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 800);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : "0px" }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <ArrowDown
            className="h-5 w-5 text-muted-foreground transition-transform duration-200"
            style={{ transform: `rotate(${progress * 180}deg)` }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
