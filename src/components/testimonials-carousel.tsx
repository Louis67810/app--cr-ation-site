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
      <Image src={src} alt="" fill className="object-cover" sizes={sizes} />
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
    <div className="mt-20 grid gap-5 lg:grid-cols-12 lg:auto-rows-[95px]">
      <PhotoTile
        src={imageAt(0)}
        sizes="25vw"
        className="lg:[grid-column:1/4] lg:[grid-row:1/8]"
      />
      <PhotoTile
        src={imageAt(1)}
        sizes="17vw"
        className="lg:[grid-column:4/6] lg:[grid-row:1/5]"
      />
      <PhotoTile
        src={imageAt(2)}
        sizes="42vw"
        className="lg:[grid-column:6/11] lg:[grid-row:1/4]"
      />
      <PhotoTile
        src={imageAt(3)}
        sizes="17vw"
        className="lg:[grid-column:11/13] lg:[grid-row:1/9]"
      />
      <PhotoTile
        src={imageAt(4)}
        sizes="25vw"
        className="lg:[grid-column:1/4] lg:[grid-row:8/13]"
      />
      <PhotoTile
        src={imageAt(5)}
        sizes="17vw"
        className="lg:[grid-column:4/6] lg:[grid-row:5/13]"
      />
      <article className="bg-[#f6f6f4] p-8 lg:[grid-column:6/11] lg:[grid-row:4/10]">
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
      <PhotoTile
        src={imageAt(6)}
        sizes="25vw"
        className="lg:[grid-column:6/9] lg:[grid-row:10/13]"
      />
      <PhotoTile
        src={imageAt(7)}
        sizes="34vw"
        className="lg:[grid-column:9/13] lg:[grid-row:10/13]"
      />
    </div>
  );
}
