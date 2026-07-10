"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/site-template";

export function BlogIndexGrid({
  posts,
  loadMoreLabel,
  query,
  disableLinks,
}: {
  posts: BlogPost[];
  loadMoreLabel: string;
  query: string;
  disableLinks?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(6);
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return posts;
    }

    return posts.filter((post) =>
      [post.title, post.excerpt, post.category, post.date]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [posts, query]);
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div>
      <div className="grid gap-7 lg:grid-cols-2">
        {visiblePosts.map((post, index) => (
          <a
            key={`${post.href}-${index}`}
            href={post.href}
            onClick={(event) => {
              if (disableLinks) event.preventDefault();
            }}
            className="group rounded-[40px] border border-transparent bg-white p-5 transition hover:border-black/10 hover:shadow-[0_31px_12px_rgba(0,0,0,0.01),0_17px_10px_rgba(0,0,0,0.03),0_8px_8px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="relative h-[495px] overflow-hidden rounded-[20px] max-sm:h-[300px]">
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${post.imageUrl})` }}
              />
              <span className="typo-body-small absolute right-8 top-8 rounded-[9px] bg-[#003441] px-4 py-[3px] leading-[1.19] text-white">
                {post.category}
              </span>
            </div>
            <div className="px-5 pb-5 pt-8">
              <div className="flex items-end justify-between gap-4">
                <h3 className="typo-h4 max-w-[610px] leading-[1.45] tracking-[-0.02em] text-black">
                  {post.title}
                </h3>
                <time className="typo-body-small shrink-0 leading-[1.19] text-black/60">
                  {post.date}
                </time>
              </div>
            </div>
          </a>
        ))}
      </div>

      {visibleCount < filteredPosts.length ? (
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + 6)}
            className="site-cta site-cta-primary cta-roll rounded-full text-[#00d494]"
          >
            {loadMoreLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
