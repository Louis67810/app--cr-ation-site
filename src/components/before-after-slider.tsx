"use client";

import { useState } from "react";

export function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  alt,
  className,
}: {
  beforeImageUrl: string;
  afterImageUrl: string;
  alt: string;
  className?: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div className={`before-after-slider relative overflow-hidden ${className ?? ""}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${afterImageUrl})` }}
        role="img"
        aria-label={alt}
      />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${beforeImageUrl})`,
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-[6px] -translate-x-1/2 bg-[#f7f7f7]"
        style={{ left: `${position}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 z-20 flex h-14 w-[38px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[5px] rounded-[22px] border border-black/25 bg-white shadow-[-6px_16px_7px_rgba(0,0,0,0.04),-3px_9px_6px_rgba(0,0,0,0.13),-1px_4px_4px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.26)]"
        style={{ left: `${position}%` }}
      >
        <span className="h-[2px] w-[15px] rounded-full bg-[#d9d9d9]" />
        <span className="h-[2px] w-[15px] rounded-full bg-[#d9d9d9]" />
        <span className="h-[2px] w-[15px] rounded-full bg-[#d9d9d9]" />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="Comparer avant apres"
        onChange={(event) => setPosition(Number(event.currentTarget.value))}
        className="before-after-range absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
