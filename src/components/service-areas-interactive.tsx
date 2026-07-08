"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ServiceArea = {
  name: string;
  href: string;
  imageUrl: string;
};

export function ServiceAreasInteractive({
  areas,
  disableLinks,
}: {
  areas: ServiceArea[];
  disableLinks?: boolean;
}) {
  const visibleAreas = areas.filter((area) => area.name.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const safeActiveIndex = Math.min(activeIndex, Math.max(visibleAreas.length - 1, 0));
  const activeArea = visibleAreas[safeActiveIndex] ?? visibleAreas[0];

  useEffect(() => {
    const node = sectionRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || visibleAreas.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleAreas.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [visible, visibleAreas.length]);

  function move(delta: number) {
    if (visibleAreas.length <= 1) return;
    setActiveIndex(
      (current) => (current + delta + visibleAreas.length) % visibleAreas.length,
    );
  }

  if (!activeArea) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,781px)_minmax(360px,632px)] lg:gap-11"
    >
      <div
        className="relative h-[708px] touch-pan-y overflow-hidden rounded-2xl bg-white max-lg:h-[560px] max-sm:h-[420px]"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null) return;

          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const deltaX = endX - touchStartX.current;
          touchStartX.current = null;

          if (Math.abs(deltaX) < 40) return;
          move(deltaX < 0 ? 1 : -1);
        }}
      >
        {visibleAreas.map((area, index) => (
          <div
            key={`${area.name}-${index}`}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
              index === safeActiveIndex
                ? "scale-100 opacity-100"
                : "scale-[1.04] opacity-0"
            }`}
            style={{ backgroundImage: `url(${area.imageUrl})` }}
            role={index === safeActiveIndex ? "img" : undefined}
            aria-label={index === safeActiveIndex ? area.name : undefined}
          />
        ))}
        <div className="absolute bottom-6 right-10 flex items-center gap-1">
          {visibleAreas.slice(0, 8).map((area, index) => (
            <span
              key={`${area.name}-dot-${index}`}
              className={`h-3 rounded-full bg-white transition-all duration-500 ${
                index === safeActiveIndex ? "w-[82px]" : "w-3 opacity-40"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="pr-1 lg:max-h-[612px] lg:overflow-y-auto">
        {visibleAreas.map((area, index) => {
          const active = index === safeActiveIndex;

          return (
            <a
              key={`${area.name}-item-${index}`}
              href={area.href}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={(event) => {
                if (disableLinks) {
                  event.preventDefault();
                }
              }}
              className="group flex min-h-[153px] items-center justify-between gap-5 border-y border-black/[0.04] bg-white py-7 text-black transition hover:bg-[#fbfbfb]"
            >
              <span className="typo-h4 transition group-hover:translate-x-1">
                {area.name}
              </span>
              <span
                className={`inline-flex h-[52px] items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-6 text-[18px] font-medium tracking-[0.03em] shadow-[0_10px_4px_rgba(0,0,0,0.01),0_6px_3px_rgba(0,0,0,0.02),0_3px_3px_rgba(0,0,0,0.03),0_1px_1px_rgba(0,0,0,0.04)] transition ${
                  active ? "translate-x-0 opacity-100" : "opacity-75"
                }`}
              >
                Explorer
                <ChevronRight size={20} strokeWidth={1.67} />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
