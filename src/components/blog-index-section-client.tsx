"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { BlogIndexGrid } from "@/components/blog-index-grid";
import type { BlogPost } from "@/lib/site-template";

export function BlogIndexSectionClient({
  title,
  searchPlaceholder,
  loadMoreLabel,
  posts,
  disableLinks,
}: {
  title: React.ReactNode;
  searchPlaceholder: string;
  loadMoreLabel: string;
  posts: BlogPost[];
  disableLinks?: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between gap-8 max-lg:flex-col max-lg:items-start">
        {title}
        <label className="flex h-[46px] w-full max-w-[350px] items-center overflow-hidden rounded-2xl border border-black/10 bg-white">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="typo-body-small h-full min-w-0 flex-1 bg-transparent px-4 text-[13px] font-medium leading-none text-black/73 outline-none placeholder:text-black/45"
          />
          <span className="flex h-full w-11 items-center justify-center bg-[#f3f3f3] text-[#b2b2b2]">
            <Search size={17} strokeWidth={2} />
          </span>
        </label>
      </div>
      <div className="mt-12 h-px w-full bg-black/17" />
      <div className="mt-16">
        <BlogIndexGrid
          posts={posts}
          loadMoreLabel={loadMoreLabel}
          query={query}
          disableLinks={disableLinks}
        />
      </div>
    </div>
  );
}
