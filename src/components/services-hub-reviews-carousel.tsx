"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCenteredCarousel } from "@/components/use-centered-carousel";
import type { ServicesHubReviewsFields } from "@/lib/site-template";

export function ServicesHubReviewsCarousel({
  reviews,
}: {
  reviews: ServicesHubReviewsFields["reviews"];
}) {
  const loopEnabled = reviews.length > 1;
  const { activeIndex, containerRef, goTo, move, onScroll } =
    useCenteredCarousel(reviews.length, { loop: loopEnabled });

  if (reviews.length === 0) return null;

  const loopedReviews =
    loopEnabled
      ? [reviews.at(-1)!, ...reviews, reviews[0]!]
      : reviews;

  return (
    <div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="hub-carousel-scroll flex snap-x snap-mandatory gap-6 overflow-x-auto py-10"
        style={{ paddingInline: "max(20px, calc((100vw - 783px) / 2))" }}
      >
        {loopedReviews.map((review, index) => (
          <article
            key={`${review.author}-${review.projectHref}-${index}`}
            className="w-[84vw] max-w-[783px] shrink-0 snap-center rounded-[32px] border border-black/10 bg-white p-5 shadow-[0_31px_12px_rgba(0,0,0,0.01),0_17px_10px_rgba(0,0,0,0.03),0_8px_8px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)] md:w-[72vw] md:rounded-[40px]"
          >
            <Link
              href={review.projectHref}
              className="group relative block h-[300px] overflow-hidden rounded-[20px] md:h-[495px]"
              aria-label={review.projectTitle}
            >
              <Image
                src={review.projectImageUrl}
                alt={review.projectTitle}
                fill
                sizes="(max-width: 768px) 84vw, 783px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-6 pt-20 text-[18px] font-medium text-white md:px-8 md:pb-8">
                {review.projectTitle}
              </span>
            </Link>

            <div className="px-1 pb-3 pt-7 md:px-4 md:pt-8">
              <p className="text-[16px] leading-[2.1] tracking-[0.01em] text-[#12110f] md:text-[18px] md:leading-[2.4]">
                {review.text}
              </p>
              <div className="mt-7 flex flex-col gap-5 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={review.avatarUrl}
                    width={61}
                    height={61}
                    alt=""
                    className="h-[61px] w-[61px] rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-[18px] font-medium text-black">{review.author}</p>
                    <p className="mt-1 text-[14px] text-[#12110f]/70">{review.city}</p>
                  </div>
                </div>
                <span
                  className="review-stars shrink-0 text-[19px] leading-none tracking-[1px] text-[#f6bb06]"
                  aria-label="5 etoiles sur 5"
                >
                  {"\u2605\u2605\u2605\u2605\u2605"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-[1324px] items-center justify-between px-5 md:px-10 xl:px-0">
        <div className="flex items-center gap-2">
          {reviews.map((review, index) => (
            <button
              key={`${review.author}-dot-${index}`}
              type="button"
              onClick={() => goTo(index)}
              className={`h-3 rounded-full transition-all ${
                activeIndex === index ? "w-8 bg-black" : "w-3 bg-black/10"
              }`}
              aria-label={`Afficher l'avis de ${review.author}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9e9e9] bg-white"
            aria-label="Avis precedent"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9e9e9] bg-white"
            aria-label="Avis suivant"
          >
            <ChevronRight size={28} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
