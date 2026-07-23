"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Review = {
  author: string;
  avatarUrl: string;
  text: string;
};

function PhotoTile({
  src,
  className,
  sizes,
}: {
  src: string;
  className: string;
  sizes: string;
}) {
  return (
    <div className={`relative hidden overflow-hidden rounded-[5px] lg:block ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        className="object-cover"
        sizes={sizes}
      />
    </div>
  );
}

export function TestimonialsCarousel({
  reviews,
  images,
}: {
  reviews: Review[];
  images: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleReviews = reviews.length > 0 ? reviews : [];
  const activeReview = visibleReviews[activeIndex] ?? visibleReviews[0];

  function move(delta: number) {
    if (visibleReviews.length === 0) return;
    setActiveIndex((current) =>
      (current + delta + visibleReviews.length) % visibleReviews.length,
    );
  }

  if (!activeReview) {
    return null;
  }

  const imageAt = (index: number) =>
    images[index] ?? images[0] ?? activeReview.avatarUrl;

  return (
    <div className="mt-20 lg:grid lg:min-h-[1238px] lg:grid-cols-[minmax(220px,383px)_minmax(150px,249px)_minmax(420px,651px)_minmax(150px,248px)] lg:gap-5">
      <div className="hidden min-h-[1238px] flex-col gap-5 lg:flex">
        <PhotoTile src={imageAt(0)} sizes="24vw" className="h-[722px]" />
        <PhotoTile src={imageAt(4)} sizes="24vw" className="flex-1" />
      </div>
      <div className="hidden min-h-[1238px] flex-col gap-5 lg:flex">
        <PhotoTile src={imageAt(1)} sizes="16vw" className="h-[428px]" />
        <PhotoTile src={imageAt(5)} sizes="16vw" className="flex-1" />
      </div>

      <div className="flex min-h-0 flex-col gap-5 lg:min-h-[1238px]">
        <PhotoTile src={imageAt(2)} sizes="42vw" className="h-[328px]" />
        <article className="bg-[#f6f6f4] p-8">
          <div className="flex gap-1 text-[23px] leading-none text-[#F6BB06]">
            {"\u2605\u2605\u2605\u2605\u2605".split("").map((star, index) => (
              <span key={index}>{star}</span>
            ))}
          </div>
          <p className="mt-4 min-h-[260px] text-[20px] leading-[2.47] tracking-[0.02em] text-[#12110f] max-sm:min-h-0 max-sm:text-[16px]">
            {activeReview.text}
          </p>
          <div className="mt-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-1">
              <Image
                src={activeReview.avatarUrl}
                width={48}
                height={48}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-[20px] leading-[2.47] tracking-[-0.02em] text-[#12110f]/70">
                {activeReview.author}
              </span>
            </div>
            <Image
              src="/images/google-logo.svg"
              width={93}
              height={31}
              alt="Google"
              className="h-auto w-[93px]"
            />
          </div>
          <div className="my-6 h-px w-full bg-black/[0.05]" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => move(-1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.09] bg-white"
                aria-label="Avis precedent"
              >
                <ChevronLeft size={20} strokeWidth={1.7} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.09] bg-white"
                aria-label="Avis suivant"
              >
                <ChevronRight size={20} strokeWidth={1.7} />
              </button>
            </div>
            <span className="text-[20px] leading-[2.47] tracking-[-0.02em] text-[#12110f]/70">
              {activeIndex + 1}/{visibleReviews.length}
            </span>
          </div>
        </article>
        <div className="hidden flex-1 grid-cols-[minmax(0,383px)_minmax(0,517px)] gap-5 lg:grid">
          <PhotoTile src={imageAt(6)} sizes="24vw" className="h-full" />
          <PhotoTile src={imageAt(7)} sizes="32vw" className="h-full" />
        </div>
      </div>

      <PhotoTile src={imageAt(3)} sizes="16vw" className="h-full min-h-[915px]" />
    </div>
  );
}
