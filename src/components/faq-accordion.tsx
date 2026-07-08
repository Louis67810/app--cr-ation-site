"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="grid gap-x-5 lg:grid-cols-2">
      {items.map((item, index) => {
        const open = index === openIndex;

        return (
          <div
            key={`${item.question}-${index}`}
            className="border-b border-black/[0.08] py-12"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="typo-h5 text-[#12110f]">
                {item.question}
              </span>
              <span className="relative h-6 w-6 shrink-0">
                <Plus
                  size={24}
                  strokeWidth={2.25}
                  className={`absolute inset-0 transition-all duration-300 ${
                    open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                  }`}
                />
                <Minus
                  size={24}
                  strokeWidth={2.25}
                  className={`absolute inset-0 transition-all duration-300 ${
                    open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                  }`}
                />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="typo-body-medium mt-4 max-w-[620px] text-black/62">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
