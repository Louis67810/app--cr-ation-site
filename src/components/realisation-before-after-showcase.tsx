"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/before-after-slider";

type RealisationBeforeAfterSlide = {
  label: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  alt: string;
};

const SLIDE_DURATION = 4500;

export function RealisationBeforeAfterShowcase({
  slides,
}: {
  slides: RealisationBeforeAfterSlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (!playing || slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(interval);
  }, [playing, slides.length]);

  if (!activeSlide) {
    return null;
  }

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className="mx-auto w-full max-w-[1324px]">
      <div className="service-card-shadow relative overflow-hidden rounded-[35px] bg-black">
        <BeforeAfterSlider
          beforeImageUrl={activeSlide.beforeImageUrl}
          afterImageUrl={activeSlide.afterImageUrl}
          alt={activeSlide.alt}
          className="h-[420px] md:h-[620px] xl:h-[841px]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[276px] bg-[linear-gradient(0deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-5 bottom-7 z-40 md:inset-x-14">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={`${slide.label}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="relative h-[12px] flex-1 overflow-hidden rounded-[7px] bg-white/25 backdrop-blur-md"
                aria-label={`Afficher ${slide.label}`}
              >
                <span
                  key={index === activeIndex ? `${activeIndex}-progress` : `${index}-idle`}
                  className={`absolute inset-y-0 left-0 block w-full origin-left rounded-[7px] bg-white ${
                    index === activeIndex
                      ? "realisation-progress-bar opacity-100"
                      : "scale-x-0 opacity-0"
                  }`}
                  style={{
                    animationDuration: `${SLIDE_DURATION}ms`,
                    animationPlayState: playing ? "running" : "paused",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 max-md:flex-col">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="inline-flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#dbdbdb] bg-[#fbfbfb] text-black"
            aria-label={playing ? "Mettre en pause" : "Lancer le diaporama"}
          >
            {playing ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex h-16 w-16 items-center justify-center rounded-xl border border-[#dbdbdb] bg-[#fbfbfb] text-black"
            aria-label="Image precedente"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="inline-flex h-16 w-16 items-center justify-center rounded-xl border border-[#dbdbdb] bg-[#fbfbfb] text-black"
            aria-label="Image suivante"
          >
            <ChevronRight size={24} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
