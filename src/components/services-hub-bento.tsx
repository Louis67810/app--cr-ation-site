"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import type { HubService } from "@/lib/site-template";

function desktopCardClass(count: number, index: number, mirrored: boolean) {
  if (count === 1) return "col-span-12 row-span-2";
  if (count === 2) return "col-span-6 row-span-2";
  if (count === 3) {
    return index === 0 ? "col-span-6 row-span-2" : "col-span-6 row-span-1";
  }

  if (!mirrored) {
    return [
      "col-span-5 row-span-2",
      "col-span-3 row-span-1",
      "col-span-4 row-span-1",
      "col-span-7 row-span-1",
    ][index] ?? "col-span-12 row-span-1";
  }

  return [
    "col-span-7 row-span-1",
    "col-span-5 row-span-2",
    "col-span-3 row-span-1",
    "col-span-4 row-span-1",
  ][index] ?? "col-span-12 row-span-1";
}

function ServiceCard({
  service,
  className = "",
}: {
  service: HubService;
  className?: string;
}) {
  return (
    <Link
      href={service.href}
      className={`group relative isolate flex overflow-hidden rounded-2xl bg-[#12333b] text-white ${className}`}
    >
      <span
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${service.imageUrl})` }}
      />
      <span className="absolute inset-0 bg-black/20" />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.84)_100%)]" />
      <span className="relative z-10 flex w-full flex-col justify-end p-7 md:p-10 xl:p-12">
        <span className="typo-h4 block max-w-[400px] text-white">{service.title}</span>
        <span className="typo-body-small mt-4 block max-w-[420px] text-white/78">
          {service.description}
        </span>
        <span className="mt-7 inline-flex items-center gap-2 text-[16px] leading-[2.09] tracking-[0.01em]">
          En savoir plus
          <ArrowUpRight size={24} strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}

export function ServicesHubBento({ services }: { services: HubService[] }) {
  const { activeIndex, containerRef, goTo, move, onScroll } =
    useCenteredCarousel(services.length);
  const chunks = Array.from({ length: Math.ceil(services.length / 4) }, (_, index) =>
    services.slice(index * 4, index * 4 + 4),
  );

  if (services.length === 0) return null;

  return (
    <>
      <div className="hidden space-y-5 lg:block">
        {chunks.map((chunk, chunkIndex) => (
          <div
            key={`service-chunk-${chunkIndex}`}
            className="grid grid-flow-dense auto-rows-[360px] grid-cols-12 gap-5"
          >
            {chunk.map((service, index) => (
              <ServiceCard
                key={`${service.href}-${index}`}
                service={service}
                className={desktopCardClass(chunk.length, index, chunkIndex % 2 === 1)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="lg:hidden">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="hub-carousel-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto px-[10vw] py-2"
        >
          {services.map((service, index) => (
            <ServiceCard
              key={`${service.href}-${index}`}
              service={service}
              className="aspect-[4/5] w-[78vw] shrink-0 snap-center md:w-[62vw]"
            />
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-2">
            {services.map((service, index) => (
              <button
                key={`${service.title}-dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/24"
                }`}
                aria-label={`Afficher ${service.title}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-white"
              aria-label="Prestation precedente"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-white"
              aria-label="Prestation suivante"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
